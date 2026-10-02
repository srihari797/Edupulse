import os
import json
import math
import sqlite3
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple


class VectorDB:
    """
    Dedicated Vector Database & Attendance Persistence Store.
    Stores multi-sample facial embeddings as normalized floating-point vectors
    and performs fast Cosine Similarity nearest-neighbor search.
    """

    def __init__(
        self,
        vector_store_path: str = "vision/vector_store/face_vectors.json",
        db_path: str = "vision/vector_store/attendance.db",
    ):
        self.vector_store_path = vector_store_path
        self.db_path = db_path

        # Ensure directory exists
        os.makedirs(os.path.dirname(self.vector_store_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)

        self._init_sqlite_db()
        self.vectors_cache: Dict[str, Dict[str, Any]] = self._load_vector_store()

    def _init_sqlite_db(self):
        """Initialize SQLite database for persistent attendance logging."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Table: Vector Registrations
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS face_vectors (
                student_id TEXT PRIMARY KEY,
                student_name TEXT NOT NULL,
                vector_dim INTEGER NOT NULL,
                vector_json TEXT NOT NULL,
                samples_json TEXT,
                registered_at TEXT NOT NULL,
                sample_count INTEGER DEFAULT 1
            )
        """
        )

        # Auto-migrate missing columns for existing SQLite tables
        cursor.execute("PRAGMA table_info(face_vectors)")
        existing_cols = [col[1] for col in cursor.fetchall()]
        if "samples_json" not in existing_cols:
            try:
                cursor.execute("ALTER TABLE face_vectors ADD COLUMN samples_json TEXT")
            except Exception as e:
                print(f"[VectorDB Migration] samples_json col error: {e}")
        if "sample_count" not in existing_cols:
            try:
                cursor.execute("ALTER TABLE face_vectors ADD COLUMN sample_count INTEGER DEFAULT 1")
            except Exception as e:
                print(f"[VectorDB Migration] sample_count col error: {e}")

        # Table: Attendance Records
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id TEXT NOT NULL,
                student_name TEXT NOT NULL,
                attendance_date TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                confidence REAL NOT NULL,
                status TEXT DEFAULT 'PRESENT',
                verification_method TEXT DEFAULT 'FACE_VECTOR_CV'
            )
        """
        )

        conn.commit()
        conn.close()

    def _load_vector_store(self) -> Dict[str, Dict[str, Any]]:
        """Load vector embeddings into memory from JSON/SQLite."""
        if os.path.exists(self.vector_store_path):
            try:
                with open(self.vector_store_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[VectorDB] Error loading JSON store: {e}")

        # Fallback to SQLite
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT student_id, student_name, vector_json, samples_json, registered_at, sample_count FROM face_vectors"
        )
        rows = cursor.fetchall()
        conn.close()

        cache = {}
        for student_id, student_name, vector_json, samples_json, registered_at, sample_count in rows:
            samples = json.loads(samples_json) if samples_json else []
            cache[student_id] = {
                "student_id": student_id,
                "student_name": student_name,
                "vector": json.loads(vector_json),
                "samples": samples,
                "registered_at": registered_at,
                "sample_count": sample_count,
            }
        return cache

    def _save_vector_store(self):
        """Persist vector store to disk."""
        with open(self.vector_store_path, "w", encoding="utf-8") as f:
            json.dump(self.vectors_cache, f, indent=2)

    @staticmethod
    def _cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        """Compute cosine similarity between two numeric vectors."""
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0

        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm1 = math.sqrt(sum(a * a for a in vec1))
        norm2 = math.sqrt(sum(b * b for b in vec2))

        if norm1 == 0.0 or norm2 == 0.0:
            return 0.0

        return dot_product / (norm1 * norm2)

    def register_face_vector(
        self,
        student_id: str,
        student_name: str,
        embeddings: List[List[float]],
    ) -> Dict[str, Any]:
        """
        Store multi-sample face vectors and centroid vector for a student in VectorDB.
        """
        if not embeddings:
            raise ValueError("No embeddings provided for registration.")

        vector_dim = len(embeddings[0])

        # Compute centroid average vector
        centroid = [0.0] * vector_dim
        for emb in embeddings:
            for i in range(vector_dim):
                centroid[i] += emb[i]

        num_samples = len(embeddings)
        centroid = [val / num_samples for val in centroid]

        # Normalize centroid vector
        norm = math.sqrt(sum(v * v for v in centroid))
        if norm > 0:
            centroid = [v / norm for v in centroid]

        registered_at = datetime.now().isoformat()

        # Update in-memory vector cache with both centroid and all multi-sample vectors
        self.vectors_cache[student_id] = {
            "student_id": student_id,
            "student_name": student_name,
            "vector": centroid,
            "samples": embeddings,
            "vector_dim": vector_dim,
            "registered_at": registered_at,
            "sample_count": num_samples,
        }

        # Save to JSON
        self._save_vector_store()

        # Save to SQLite
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO face_vectors 
            (student_id, student_name, vector_dim, vector_json, samples_json, registered_at, sample_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
            (
                student_id,
                student_name,
                vector_dim,
                json.dumps(centroid),
                json.dumps(embeddings),
                registered_at,
                num_samples,
            ),
        )
        conn.commit()
        conn.close()

        print(
            f"[VectorDB] Registered multi-sample vectors for student '{student_name}' ({student_id}) with {num_samples} samples."
        )
        return self.vectors_cache[student_id]

    def is_student_registered(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Check if student_id or email is already registered in vector store."""
        target_id = str(student_id).lower().strip()
        for s_id, record in self.vectors_cache.items():
            if str(s_id).lower().strip() == target_id:
                return record
        return None

    def search_nearest_vector(
        self, query_vector: List[float], threshold: float = 0.35
    ) -> Tuple[Optional[Dict[str, Any]], float]:
        """
        Query vector index for closest matching student face vector.
        Compares query vector against centroid AND all multi-angle sample embeddings.
        Returns (student_info, confidence_score).
        """
        best_match = None
        best_score = -1.0

        for student_id, record in self.vectors_cache.items():
            stored_vector = record.get("vector")
            samples = record.get("samples", [])

            # Compute similarity against centroid
            score = self._cosine_similarity(query_vector, stored_vector) if stored_vector else -1.0

            # Compute similarity against each individual captured sample vector
            if samples:
                for sample_v in samples:
                    s_score = self._cosine_similarity(query_vector, sample_v)
                    if s_score > score:
                        score = s_score

            if score > best_score:
                best_score = score
                best_match = record

        if best_score >= threshold and best_match is not None:
            return best_match, round(best_score, 4)

        return None, round(max(0.0, best_score), 4)

    def mark_attendance(
        self, student_id: str, student_name: str, confidence: float
    ) -> Dict[str, Any]:
        """Record attendance in vector database log."""
        today_date = datetime.now().strftime("%Y-%m-%d")
        now_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Check if attendance already marked today
        cursor.execute(
            "SELECT id, timestamp FROM attendance WHERE student_id = ? AND attendance_date = ?",
            (student_id, today_date),
        )
        existing = cursor.fetchone()

        if existing:
            conn.close()
            return {
                "already_marked": True,
                "message": f"Attendance already marked today at {existing[1]}",
                "student_id": student_id,
                "student_name": student_name,
                "attendance_date": today_date,
                "timestamp": existing[1],
                "confidence": confidence,
            }

        cursor.execute(
            """
            INSERT INTO attendance (student_id, student_name, attendance_date, timestamp, confidence, status)
            VALUES (?, ?, ?, ?, ?, 'PRESENT')
        """,
            (student_id, student_name, today_date, now_time, confidence),
        )

        conn.commit()
        conn.close()

        return {
            "already_marked": False,
            "message": f"Attendance successfully marked for {student_name}!",
            "student_id": student_id,
            "student_name": student_name,
            "attendance_date": today_date,
            "timestamp": now_time,
            "confidence": confidence,
        }

    def get_attendance_history(
        self, student_id: Optional[str] = None, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Retrieve attendance records."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        if student_id:
            cursor.execute(
                """
                SELECT student_id, student_name, attendance_date, timestamp, confidence, status
                FROM attendance WHERE student_id = ? ORDER BY id DESC LIMIT ?
            """,
                (student_id, limit),
            )
        else:
            cursor.execute(
                """
                SELECT student_id, student_name, attendance_date, timestamp, confidence, status
                FROM attendance ORDER BY id DESC LIMIT ?
            """,
                (limit,),
            )

        rows = cursor.fetchall()
        conn.close()

        return [
            {
                "student_id": row[0],
                "student_name": row[1],
                "attendance_date": row[2],
                "timestamp": row[3],
                "confidence": row[4],
                "status": row[5],
            }
            for row in rows
        ]

    def list_registered_students(self) -> List[Dict[str, Any]]:
        """List all students registered in VectorDB."""
        return [
            {
                "student_id": rec["student_id"],
                "student_name": rec["student_name"],
                "registered_at": rec.get("registered_at"),
                "sample_count": rec.get("sample_count", 1),
            }
            for rec in self.vectors_cache.values()
        ]

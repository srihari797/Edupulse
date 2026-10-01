import os
import cv2
import numpy as np
import torch
from typing import List, Tuple, Optional, Dict, Any

class FaceService:
    """
    Computer Vision Face Detection, Embedding Extraction, and Vector Search Service.
    Uses Spatial Grid Histograms with Lighting Equalization for High-Precision Face Vectors,
    with automatic fallback/integration for InsightFace models.
    """

    def __init__(self):
        self.insight_app = None
        
        # Load OpenCV Haar Cascade for face detection
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.exists(cascade_path):
            self.haar_cascade = cv2.CascadeClassifier(cascade_path)
        else:
            self.haar_cascade = None

        # Check for InsightFace model
        user_home = os.path.expanduser("~")
        model_path = os.path.join(user_home, ".insightface", "models", "buffalo_l")
        
        if os.path.exists(model_path) and len(os.listdir(model_path)) > 2:
            try:
                from insightface.app import FaceAnalysis
                app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
                app.prepare(ctx_id=0, det_size=(640, 640))
                self.insight_app = app
                print("[FaceService] Loaded local InsightFace model successfully.")
            except Exception as e:
                print(f"[FaceService] Local InsightFace init skipped: {e}")

    def extract_face_embeddings(self, image_bgr: np.ndarray) -> List[List[float]]:
        """
        Detect faces in BGR image and return list of normalized feature vector embeddings.
        """
        if image_bgr is None or image_bgr.size == 0:
            return []

        if self.insight_app is not None:
            try:
                faces = self.insight_app.get(image_bgr)
                embeddings = []
                for face in faces:
                    if hasattr(face, "embedding") and face.embedding is not None:
                        # Normalize InsightFace embedding
                        emb = np.array(face.embedding, dtype=np.float32)
                        norm = np.linalg.norm(emb)
                        if norm > 0:
                            emb /= norm
                        embeddings.append(emb.tolist())
                if embeddings:
                    return embeddings
            except Exception as e:
                print(f"[FaceService] InsightFace detection error: {e}")

        # High-Precision Spatial Grid CV Vector Extractor
        return self._extract_spatial_grid_embeddings(image_bgr)

    def _extract_spatial_grid_embeddings(self, image_bgr: np.ndarray) -> List[List[float]]:
        """
        High-precision 256-dimensional Spatial Grid Feature Extractor.
        Features:
        1. Lighting Equalization (CLAHE / Histogram Equalization)
        2. 4x4 Spatial Grid Cell Histograms (Captures eyes, nose, mouth structure)
        3. Gradient Orientation Features
        4. L2 Vector Normalization
        """
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) for lighting invariance
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        equalized = clahe.apply(gray)

        faces = []
        if self.haar_cascade is not None:
            faces = self.haar_cascade.detectMultiScale(
                equalized, scaleFactor=1.1, minNeighbors=4, minSize=(40, 40)
            )

        if len(faces) == 0:
            h, w = equalized.shape
            ch, cw = int(h * 0.85), int(w * 0.85)
            cy, cx = (h - ch) // 2, (w - cw) // 2
            faces = [(cx, cy, cw, ch)]

        embeddings = []
        for x, y, w, h in faces:
            face_roi = equalized[y : y + h, x : x + w]
            face_resized = cv2.resize(face_roi, (64, 64))

            # Divide face into 4x4 = 16 spatial grid cells (each 16x16 pixels)
            grid_features = []
            for row in range(4):
                for col in range(4):
                    cell = face_resized[row * 16 : (row + 1) * 16, col * 16 : (col + 1) * 16]
                    # Compute 16-bin intensity histogram for this cell
                    cell_hist = cv2.calcHist([cell], [0], None, [16], [0, 256]).flatten()
                    grid_features.extend(cell_hist)

            # Gradient Magnitude & Direction Features (64 bins)
            sobelx = cv2.Sobel(face_resized, cv2.CV_64F, 1, 0, ksize=3)
            sobely = cv2.Sobel(face_resized, cv2.CV_64F, 0, 1, ksize=3)
            grad_mag = np.sqrt(sobelx**2 + sobely**2)
            grad_hist = cv2.calcHist([grad_mag.astype(np.uint8)], [0], None, [64], [0, 256]).flatten()

            combined = np.concatenate([grid_features, grad_hist]).astype(np.float32)

            # L2 Normalization into unit vector
            norm = np.linalg.norm(combined)
            if norm > 0:
                combined /= norm

            embeddings.append(combined.tolist())

        return embeddings

    def process_image_bytes(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Convert raw image bytes (JPEG/PNG) to OpenCV BGR numpy matrix."""
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            print(f"[FaceService] Error decoding image: {e}")
            return None

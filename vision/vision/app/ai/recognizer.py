import cv2
import torch
import numpy as np
from insightface.app import FaceAnalysis


class FaceRecognizer:

    def __init__(self):

        self.face_app = FaceAnalysis(name="buffalo_l")
        self.face_app.prepare(ctx_id=0, det_size=(640, 640))

        self.database = torch.load(
            "vision/embeddings/embeddings.pt",
            map_location="cpu"
        )

        print("Embeddings Loaded Successfully")

    def cosine_similarity(self, emb1, emb2):

        emb1 = np.array(emb1)
        emb2 = np.array(emb2)

        similarity = np.dot(emb1, emb2) / (
            np.linalg.norm(emb1) * np.linalg.norm(emb2)
        )

        return similarity

    def recognize(self, image):

        faces = self.face_app.get(image)

        if len(faces) == 0:
            return "No Face", 0.0

        embedding = faces[0].embedding

        best_name = "Unknown"
        best_score = -1

        for person in self.database:

            for stored_embedding in self.database[person]:

                score = self.cosine_similarity(
                    embedding,
                    stored_embedding.numpy()
                )

                if score > best_score:

                    best_score = score
                    best_name = person

        # Threshold
        if best_score < 0.45:
            best_name = "Unknown"

        return best_name, round(float(best_score), 3)


    def reload_database(self):

        self.database = torch.load(
            "vision/embeddings/embeddings.pt",
            map_location="cpu"
        )

        print("Embeddings Reloaded")
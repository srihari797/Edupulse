import os
import cv2
import torch
from insightface.app import FaceAnalysis

EMBEDDING_FILE = "vision/embeddings/embeddings.pt"
UPLOAD_FOLDER = "vision/uploads"

app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0, det_size=(640, 640))


def add_person(person_name):

    # Load existing database
    

    if os.path.exists(EMBEDDING_FILE):
        database = torch.load(EMBEDDING_FILE, map_location="cpu")
    else:
        database = {}
        
    if person_name in database:
        raise Exception(f"{person_name} already exists.")

    person_folder = os.path.join(UPLOAD_FOLDER, person_name)

    if not os.path.exists(person_folder):
        raise Exception(f"{person_name} folder not found.")

    embeddings = []

    for image_name in os.listdir(person_folder):

        if not image_name.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        image_path = os.path.join(person_folder, image_name)

        image = cv2.imread(image_path)

        if image is None:
            continue

        faces = app.get(image)

        if len(faces) == 0:
            print(f"No face found in {image_name}")
            continue

        embeddings.append(torch.tensor(faces[0].embedding))

    if len(embeddings) == 0:
        raise Exception("No valid face images found.")

    database[person_name] = embeddings

    torch.save(database, EMBEDDING_FILE)

    print("--------------------------------")
    print(f"{person_name} Added Successfully")
    print(f"Images Used : {len(embeddings)}")
    print("--------------------------------")
if __name__ == "__main__":

    person = input("Enter person name: ").strip()

    add_person(person)
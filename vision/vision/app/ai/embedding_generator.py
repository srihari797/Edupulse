import os
import cv2
import torch
from insightface.app import FaceAnalysis

# Initialize InsightFace
app = FaceAnalysis(name="buffalo_l")
app.prepare(ctx_id=0, det_size=(640, 640))

UPLOAD_FOLDER = "vision/uploads"
OUTPUT_FILE = "vision/embeddings/embeddings.pt"


def add_person(person_name):

    # Load existing embeddings
    if os.path.exists(OUTPUT_FILE):
        database = torch.load(OUTPUT_FILE, map_location="cpu")
    else:
        database = {}

    person_path = os.path.join(UPLOAD_FOLDER, person_name)

    if not os.path.exists(person_path):
        print(f"{person_name} folder not found.")
        return

    embeddings = []

    for image_name in os.listdir(person_path):

        image_path = os.path.join(person_path, image_name)

        image = cv2.imread(image_path)

        if image is None:
            continue

        faces = app.get(image)

        if len(faces) == 0:
            print(f"No face found in {image_name}")
            continue

        embeddings.append(torch.tensor(faces[0].embedding))

    if len(embeddings) == 0:
        print("No valid face images found.")
        return

    # Update only this person
    database[person_name] = embeddings

    torch.save(database, OUTPUT_FILE)

    print("--------------------------------")
    print(f"{person_name} Added Successfully")
    print(f"Images Used : {len(embeddings)}")
    print("--------------------------------")


if __name__ == "__main__":

    person = input("Enter person name: ").strip()

    add_person(person)


# import os
# import cv2
# import torch
# from insightface.app import FaceAnalysis

# # Initialize InsightFace
# app = FaceAnalysis(name="buffalo_l")
# app.prepare(ctx_id=0, det_size=(640, 640))

# UPLOAD_FOLDER = "vision/uploads"
# OUTPUT_FILE = "vision/embeddings/embeddings1.pt"

# database = {}

# for person in os.listdir(UPLOAD_FOLDER):

#     person_path = os.path.join(UPLOAD_FOLDER, person)

#     if not os.path.isdir(person_path):
#         continue

#     embeddings = []

#     for image_name in os.listdir(person_path):

#         image_path = os.path.join(person_path, image_name)

#         image = cv2.imread(image_path)

#         if image is None:
#             continue

#         faces = app.get(image)

#         if len(faces) == 0:
#             print(f"No face found in {image_name}")
#             continue

#         embedding = faces[0].embedding

#         embeddings.append(torch.tensor(embedding))

#     database[person] = embeddings

# torch.save(database, OUTPUT_FILE)

# print("--------------------------------")
# print("Embeddings Generated Successfully")
# print("--------------------------------")

# for person in database:
#     print(person, len(database[person]))
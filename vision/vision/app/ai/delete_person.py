import os
import torch

EMBEDDING_FILE = "vision/embeddings/embeddings.pt"


def delete_person(person_name):

    if not os.path.exists(EMBEDDING_FILE):
        print("Embedding file not found.")
        return False

    database = torch.load(EMBEDDING_FILE, map_location="cpu")

    if person_name not in database:
        print(f"{person_name} not found.")
        return False

    del database[person_name]

    torch.save(database, EMBEDDING_FILE)

    print(f"{person_name} deleted successfully.")

    return True


if __name__ == "__main__":

    person = input("Enter person name to delete: ").strip()

    delete_person(person)
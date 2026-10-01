# import cv2

# from recognizer import FaceRecognizer

# recognizer = FaceRecognizer()

# image = cv2.imread("/teamspace/uploads/WhatsApp Image 2026-07-08 at 5.35.45 PM.jpeg")

# name, confidence = recognizer.recognize(image)

# print(name)
# print(confidence)
import torch 
embed="/teamspace/studios/this_studio/vision/embeddings/embeddings.pt"
data = torch.load(embed)
print(data.keys())
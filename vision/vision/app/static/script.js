const video = document.getElementById("video");
const canvas = document.getElementById("canvas");

let mode = "";   // "capture" or "recognize"

// =====================
// Start Webcam
// =====================

async function startCamera() {

    try {

        const stream = await navigator.mediaDevices.getUserMedia({
            video: true
        });

        video.srcObject = stream;
        video.play().catch(e => {
            if (e.name !== "AbortError") console.warn("Camera play interrupted:", e);
        });

    } catch (err) {

        console.error(err);
        alert("Unable to access camera");

    }
}

startCamera();


// =====================
// Capture Mode
// =====================

function startCapture() {

    const username = document.getElementById("username").value.trim();

    if (username === "") {

        alert("Enter a name");
        return;

    }

    mode = "capture";

    console.log("Capture Mode Started");
}


// =====================
// Recognition Mode
// =====================

function startRecognition() {

    mode = "recognize";

    console.log("Recognition Mode Started");

}


// =====================
// Send Frame
// =====================

async function sendFrame() {

    if (mode === "")
        return;

    if (video.videoWidth === 0)
        return;

    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {

        const formData = new FormData();

        formData.append("image", blob, "frame.jpg");

        try {

            // =====================
            // DATASET CAPTURE
            // =====================

            if (mode === "capture") {

                const username = document.getElementById("username").value.trim();

                formData.append("username", username);

                const response = await fetch("/capture", {

                    method: "POST",
                    body: formData

                });

                const data = await response.json();

                console.log(data);

        if (data.status === "completed") {

            mode = "";
            


            alert("60 images captured successfully!");
            await generateEmbeddings(username);

            return;
        }

        console.log(`Captured ${data.captured}/60`);

            }

            // =====================
            // FACE RECOGNITION
            // =====================

            else if (mode === "recognize") {

                const response = await fetch("/recognize", {

                    method: "POST",
                    body: formData

                });

                const data = await response.json();

                console.log(data);

                document.getElementById("name").textContent = data.name;

                document.getElementById("confidence").textContent =
                    (data.confidence * 100).toFixed(2) + "%";

            }

        } catch (err) {

            console.error(err);

        }

    }, "image/jpeg");

}
async function generateEmbeddings(username){

    const response = await fetch("/generate_embeddings",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({

            username:username

        })

    });

    const data = await response.json();

    alert(data.message);

    console.log(data);

}


// Capture one frame every second

setInterval(sendFrame, 1000);
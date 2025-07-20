window.addEventListener("DOMContentLoaded", () => {
  // Try to get camera
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      const video = document.getElementById("video");
      if (video) {
        video.srcObject = stream;
        video.play();
      }
    })
    .catch((err) => {
      alert("Camera access is required! App will not work without it.");
    });

  // Disable context menu (right-click)
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  // Disable most keyboard shortcuts
  window.addEventListener("keydown", (e) => {
    // For debugging, you can log:
    // console.log(e);

    // Common keys to block:
    const blockedKeys = ["F11", "F12", "Escape"];

    const ctrlCombos = ["w", "W", "r", "R", "n", "N", "q", "Q"];

    if (
      blockedKeys.includes(e.key) ||
      (e.ctrlKey && ctrlCombos.includes(e.key)) ||
      (e.ctrlKey && e.shiftKey) // Ctrl+Shift+anything (like Ctrl+Shift+I)
    ) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  });

  window.addEventListener("beforeunload", () => {
    console.log("⚠️ Renderer is unloading (window is closing).");
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var audio = document.getElementById("audio");
  var button = document.getElementById("play-button");
  var icon = document.getElementById("play-icon");
  var timeLeft = document.getElementById("time-left");

  // Ensure the audio can be played
  audio.addEventListener("loadedmetadata", function () {
    console.log("Audio loaded. Duration: " + audio.duration + " seconds");
    timeLeft.textContent = formatTime(audio.duration); // Initialize timer with full duration
  });

  function formatTime(seconds) {
    var mins = Math.floor(seconds / 60);
    var secs = Math.floor(seconds % 60);
    return mins + ":" + (secs < 10 ? "0" : "") + secs;
  }

  audio.addEventListener("timeupdate", function () {
    var remainingTime = audio.duration - audio.currentTime;
    timeLeft.textContent = formatTime(remainingTime);
  });

  button.addEventListener("click", function () {
    if (audio.paused) {
      audio
        .play()
        .then(function () {
          console.log("Audio is playing");
          button.classList.remove("stopped");
          button.classList.add("playing");
          icon.src = "/media/pause.svg"; // Change to pause icon
        })
        .catch(function (error) {
          console.error("Error playing audio:", error);
        });
    } else {
      audio.pause();
      button.classList.remove("playing");
      button.classList.add("stopped");
      icon.src = "/media/play.svg"; // Change to play icon
    }
  });

  audio.addEventListener("ended", function () {
    button.classList.remove("playing");
    button.classList.add("stopped");
    icon.src = "/media/play.svg"; // Back to play icon
    timeLeft.textContent = formatTime(audio.duration); // Show full duration again
  });
});

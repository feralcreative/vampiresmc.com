(function () {
  // Define the path to the `style.min.css` file (adjust if necessary)
  const cssFileUrl = document.location.origin + "/wp-content/themes/your-child-theme/style.min.css";

  const checkInterval = 500; // Check every 0.5 seconds (500 milliseconds)
  let originalHash = null; // Store the initial hash of the CSS file

  // Function to hash the content of the CSS file
  function hashString(str) {
    let hash = 0,
      i,
      chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
      chr = str.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }

  // Function to fetch the CSS file and calculate its hash
  function checkForCssChanges() {
    fetch(cssFileUrl)
      .then((response) => response.text())
      .then((data) => {
        const newHash = hashString(data);

        // If this is the first check, save the hash
        if (originalHash === null) {
          originalHash = newHash;
        } else if (newHash !== originalHash) {
          // If the hash has changed, trigger the reload
          console.log("CSS change detected. Reloading...");
          location.reload(); // Reload the page immediately
        }
      })
      .catch((error) => {
        console.error("Error fetching the CSS file:", error);
      });
  }

  // Set an interval to check CSS changes every 0.5 seconds
  setInterval(checkForCssChanges, checkInterval);
})();

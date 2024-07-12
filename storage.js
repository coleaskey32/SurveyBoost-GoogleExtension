// storage.js

// Function to save data to Chrome's local storage
function saveToLocalStorage(key, value) {
    chrome.storage.local.set({ [key]: value }, function() {
      console.log(`${key} is saved to local storage.`);
    });
  }
  
  // Function to get data from Chrome's local storage
  function getFromLocalStorage(key, callback) {
    chrome.storage.local.get([key], function(result) {
      callback(result[key]);
    });
  }
  
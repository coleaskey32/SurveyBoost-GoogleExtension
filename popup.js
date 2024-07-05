document.addEventListener('DOMContentLoaded', () => {
  const fetchButton = document.getElementById('fetch');
  if (fetchButton) {
    fetchButton.addEventListener('click', () => {
      fetch('http://127.0.0.1:8000/api/hello')
        .then(response => response.json())
        .then(data => {
          document.getElementById('result').innerText = data.message;
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    });
  } else {
    console.error('Button with ID "fetch" not found.');
  }
});

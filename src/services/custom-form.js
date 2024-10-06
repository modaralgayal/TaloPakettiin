<script>
    document.addEventListener('DOMContentLoaded', function() {
      const form = document.querySelector('.eael-register-form'); // Adjust this selector to match your actual form's class
      if (form) {
        form.addEventListener('submit', async function(event) {
          event.preventDefault();
  
          const username = document.querySelector('input[name="username"]').value;
          const email = document.querySelector('input[name="email"]').value;
          const password = document.querySelector('input[name="password"]').value;
  
          const formData = {
            username: username,
            email: email,
            password: password,
          };
  
          try {
            // Send the data to your backend
            const response = await fetch('https://bur.hdn.mybluehost.me/sign-in-page/', { // Replace with your backend URL
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(formData), // Send the form data as JSON
            });
  
            const result = await response.json();
  
            if (response.ok) {
              alert('Signup successful!');
            } else {
              alert('Error: ' + result.error);
            }
          } catch (error) {
            console.error('Error during signup:', error);
            alert('There was an error submitting the form.');
          }
        });
      }
    });
  </script>
  
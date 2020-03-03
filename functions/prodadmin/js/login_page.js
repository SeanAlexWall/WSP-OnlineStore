function login_page() {
    firebase.auth().onAuthStateChanged(user => {
        if (user && user.email === 'prodadmin@test.com') {
            window.location.href = '/home';
        }
        else {
            gblPageContent.innerHTML = `
            <form class="form-signin">
              <h3>Sign In</h3>
              <input type="email" class="form-control" id="email" placeholder="Email Address">
              <input type="password" class="form-control" id="password" placeholder="Password">
              <button type="button" class="btn btn-primary" onclick="signIn()">Submit</button>
            </form>
            `;
        }
    });
}

async function signIn(){
    try{
        const email = document.getElementById('email').value;
        if(email !== 'prodadmin@test.com') throw new Error("not product admin");
        const password = document.getElementById('password').value;
        await firebase.auth().signInWithEmailAndPassword(email, password);

        window.location.href = '/home';
    }
    catch(e){
        gblPageContent.innerHTML = `Login Failed:<br> ${e}  <br
                <a href="/login" class="btn btn-outline-primary">Go back to Login</a>
        `;
    }
}
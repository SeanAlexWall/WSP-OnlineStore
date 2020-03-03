function profile_page() {
    //gblPageContent.innerHTML = `<h1>Profile page</h1>`;
    profile_page_secured();
    //create_profile();
}

let profile = {};

async function profile_page_secured() {
    gblPageContent.innerHTML = `<h1>Profile page</h1>`;
    profile = await getProfile();
    let name = 'test name';
    let bio = 'test bio';
    let buttonText = 'Create Profile';
    if (profile != null) {
        name = profile.name;
        bio = profile.bio;
        buttonText = 'Update Profile'
    }
    console.log("profile", '=>', profile);
    gblPageContent.innerHTML = `<h1>User Profile</h1>`;
    gblPageContent.innerHTML += `
    <a href='/home' class="btn btn-outline-primary">Home</a>
    <a href='/add' class="btn btn-outline-primary">Add Product</a>
    <a href='/show' class="btn btn-outline-primary">Show Products</a>
    <div class="form-group">
        Name: <input class="form-control" type="text" id="name" value="${name}"/>
        <p id="name_error" style="color:red;" />
    </div>
    <div class="form-group">
        Bio: <br>
        <textarea class="form-control"  id="bio" cols="40" rows="5">${bio}</textarea>
        <p id="bio_error" style="color:red;" />
    </div>`;
    if(profile != null){

        gblPageContent.innerHTML += ` Current Profile Picture:<br>
        <image src="${profile.image_url}"><br></br>`
    }
    
    gblPageContent.innerHTML += `
    <div class="form-group">
        Profile Picture: <input type="file" id="imageButton" value="upload"/>
        <p id="image_error" style="color:red;" />
    </div>
    <button class="btn btn-primary" type="button" onclick="updateProfile()">${buttonText}</button>
    
    `;
    const imageButton = document.getElementById("imageButton");
    imageButton.addEventListener("change", e => {
        imageFile2update = e.target.files[0];
    });
}
function getProfile() {
    const promise = new Promise(function (resolve, reject) {
        //Change how this works later
        //++++++++++++++++++++++++++++++++++++
        let profileId = 000000;
        //++++++++++++++++++++++++++++++++++++

        let profileRef = firebase.firestore().collection(PROF_COLLECTION)
        let query = profileRef.where('profileId', '==', profileId).get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log('No matching documents.');
                    resolve(null);
                }

                snapshot.forEach(doc => {
                    console.log(doc.id, '=>', doc.data());
                    const { name, bio, image, image_url } = doc.data();
                    let profile1 = { docId: doc.id, name, bio, image, image_url };
                    resolve(profile1);
                });
            })
            .catch(err => {
                console.log('Error getting documents', err);
                reject(err);
            })
    });
    return promise;
}
async function updateProfile() {
    //Change how this works later
    //++++++++++++++++++++++++++++++++++++
    let profileId = 000000;
    //++++++++++++++++++++++++++++++++++++

    const newName = document.getElementById('name').value;
    const newBio = document.getElementById('bio').value;

    const nameErrorTg = document.getElementById('name_error');
    const bioErrorTg = document.getElementById('bio_error');
    const imageErrorTg = document.getElementById('image_error');

    //validate input
    nameErrorTg.innerHTML = validate_name(newName);
    bioErrorTg.innerHTML = validate_summary(newBio);

    if (profile != null) {
        
        if (nameErrorTg.innerHTML || bioErrorTg.innerHTML) {
            return;
        }
        let updated = false;
        const newInfo = {};
        if (profile.name !== newName) {
            newInfo.name = newName;
            updated = true;
        }
        if (profile.bio !== newBio) {
            newInfo.bio = newBio;
            updated = true;
        }
        if (imageFile2update) {
            updated = true;
        }
        if (!updated) {
            return;
        }



        try {

            if (imageFile2update) {
                const imageRef2Del = firebase.storage().ref().child(IMAGE_FOLDER + profile.image);
                await imageRef2Del.delete();
                const image = Date.now() + imageFile2update.name;
                const newImageRef = firebase.storage().ref(IMAGE_FOLDER + image);
                const taskSnapshot = await newImageRef.put(imageFile2update);
                const image_url = await taskSnapshot.ref.getDownloadURL();
                newInfo.image = image;
                newInfo.image_url = image_url;
            }
            await firebase.firestore().collection(PROF_COLLECTION).doc(profile.docId).update(newInfo);

            gblPageContent.innerHTML = `
            <h1>profile had been updated!</h1>
            <a href='/home' class='btn btn-outline-primary'>home</a>
            <a href='/profile' class='btn btn-outline-primary'>profile</a>
        `;
        }
        catch (e) {
            gblPageContent.innerHTML = `
            <h1>Cannot update profile</h1>
            ${JSON.stringify(e)}
        `;
            console.log(e);
        }
    }
    else {
        if (!imageFile2update) {
            imageErrorTg.innerHTML = "Error: Image file not Selected";
        }else{
            imageErrorTg.innerHTML = null;
        }
        if (nameErrorTg.innerHTML || bioErrorTg.innerHTML || imageErrorTg.innerHTML) {
            return;
        }
        try {
            const image = Date.now() + imageFile2update.name;
            const newImageRef = firebase.storage().ref(IMAGE_FOLDER + image);
            const taskSnapshot = await newImageRef.put(imageFile2update);
            const image_url = await taskSnapshot.ref.getDownloadURL();
            await firebase.firestore().collection(PROF_COLLECTION).doc().set({ name: newName, bio: newBio, image, image_url, profileId });

            gblPageContent.innerHTML = `
            <h1>profile had been created!</h1>
            <a href='/home' class='btn btn-outline-primary'>home</a>
            <a href='/profile' class='btn btn-outline-primary'>profile</a>
        `;
        }
        catch (e) {
            gblPageContent.innerHTML = `
            <h1>Cannot update profile</h1>
            ${JSON.stringify(e)}
        `;
            console.log(e);
        }
    }
}
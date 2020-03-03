function add_page(){
    auth('prodadmin@test.com', add_page_secured, '/login');
}

let gblImageFile; //file selected

function add_page_secured(){
    gblPageContent.innerHTML = `<h1>add PAGE</h1>`;
    gblPageContent.innerHTML += `
    <a href='/home' class="btn btn-outline-primary">Home</a>
    <a href='/show' class="btn btn-outline-primary">Show Products</a>
    <div class="form-group">
        Name: <input class="form-control" type="text" id="name" />
        <p id="name_error" style="color:red;" />
    </div>
    <div class="form-group">
        Summary: <br>
        <textarea class="form-control"  id="summary" cols="40" rows="5"></textarea>
        <p id="summary_error" style="color:red;" />
    </div>
    <div class="form-group">
        Price: <input class="form-control" type="text" id="price" />
        <p id="price_error" style="color:red;" />
    </div>
    <div class="form-group">
        Image: <input type="file" id="imageButton" value="upload"/>
        <p id="image_error" style="color:red;" />
    </div>
    <button class="btn btn-primary" type="button" onclick="addProduct()">Add</button>
    
    `;

    const imageButton = document.getElementById('imageButton')
    imageButton.addEventListener('change', e=>{
        gblImageFile = e.target.files[0];
        console.log('fileupload', e.target.files[0])
    })
}

async function addProduct() {
    const name = document.getElementById('name').value;
    const summary = document.getElementById('summary').value;
    let price = document.getElementById('price').value;

    const nameErrorTg = document.getElementById('name_error');
    const summaryErrorTg = document.getElementById('summary_error');
    const priceErrorTg = document.getElementById('price_error');
    const imageErrorTg = document.getElementById('image_error');
    //validate input

    nameErrorTg.innerHTML = validate_name(name);
    summaryErrorTg.innerHTML = validate_summary(summary);
    priceErrorTg.innerHTML = validate_price(price);
    if(!gblImageFile){
        imageErrorTg.innerHTML = "Error: Image file not Selected";
    }
    else 
        imageErrorTg.innerHTML = null;

    if(nameErrorTg.innerHTML || summaryErrorTg.innerHTML 
        || priceErrorTg.innerHTML || imageErrorTg.innerHTML){
        return;
    }

    try{
        const image = Date.now() + gblImageFile.name;
        const ref = firebase.storage().ref(IMAGE_FOLDER + image);
        const taskSnapshot = await ref.put(gblImageFile);
        const image_url = await taskSnapshot.ref.getDownloadURL();

        price = Number(price);
        await firebase.firestore().collection(COLLECTION).doc().set({name, summary, price, image, image_url})

        gblPageContent.innerHTML = `
            <h1>${name} had been added!</h1>
            <a href='/show' class='btn btn-outline-primary'>Show All Products</a>
        `;
    }
    catch(e){
        gblPageContent.innerHTML = `
            <h1>Cannot add product</h1>
            ${JSON.stringify(e)}
        `;
        console.log(e);
    }
}
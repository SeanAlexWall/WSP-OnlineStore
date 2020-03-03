function show_page() {
    auth('prodadmin@test.com', show_page_secured, '/login');
}

let products; //list of products

async function show_page_secured() {
    gblPageContent.innerHTML = `<h1>SHOW PRODUCTS</h1>`
    gblPageContent.innerHTML += `
      <a href='/add' class="btn btn-outline-primary">Add A Product</a>
      <a href='/home' class="btn btn-outline-primary">Home</a>
      <br>
    `;


    try {
        products = [];
        const snapshot = await firebase.firestore().collection(COLLECTION).get();
        snapshot.forEach(document => {
            const { name, summary, price, image, image_url } = document.data();
            const product = { docId: document.id, name, summary, price, image, image_url };
            products.push(product);
        });
    }
    catch (e) {
        gblPageContent.innerHTML = "ERROR: <br>" + e;
        return;
    }
    console.log(products);

    if (products.length === 0) {
        gblPageContent.innerHTML += "<h1>No products</h1>";
        return;
    }

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        gblPageContent.innerHTML += `
          <div id="${p.docId}" class="card" style="width: 18rem; display: inline-block" >
            <img src="${p.image_url}" class="card-img-top">
            <div class="card-body">
              <h5 class="card-title">${p.name}</h5>
              <p class="card-text">${p.price}<br>${p.summary}</p>
              <button class="btn btn-primary" type="button" onclick="editProduct(${i})">Edit</button>
              <button class="btn btn-danger" type="button" onclick="deleteProduct(${i})">Delete</button>
            </div>
          </div>
        `;
    }
}

let cardOriginal;
let imageFile2update;

function editProduct(index){
    const p = products[index];
    const card = document.getElementById(p.docId);
    cardOriginal = card.innerHTML;

    card.innerHTML = `
        <div class="form-group">
            Name: <input class="form-control" type="text" id="name" value="${p.name}"/>
            <p id="name_error" style="color:red;" />
        </div>
        <div class="form-group">
            Summary: <br>
            <textarea class="form-control"  id="summary" cols="40" rows="5">${p.summary}</textarea>
            <p id="summary_error" style="color:red;" />
        </div>
        <div class="form-group">
            Price: <input class="form-control" type="text" id="price" value="${p.price}"/>
            <p id="price_error" style="color:red;" />
        </div>
        Current Image:<br>
        <image src="${p.image_url}"><br>
        <div class="form-group">
            Image: <input type="file" id="imageButton" value="upload"/>
        </div>
        <button class="btn btn-primary" type="button" onclick="update(${index})">Update</button>
        <button class="btn btn-secondary" type="button" onclick="cancel(${index})">Cancel</button>

    `;

    const imageButton = document.getElementById("imageButton");
    imageButton.addEventListener("change", e=>{
        imageFile2update = e.target.files[0];
        
    });

}
async function update(index){
    const p = products[index];
    const newName = document.getElementById("name").value;
    const newSummary = document.getElementById("summary").value;
    const newPrice = document.getElementById("price").value;

    const nameErrortg = document.getElementById("name_error");
    const summaryErrortg = document.getElementById("summary_error");
    const priceErrortg = document.getElementById("price_error");
    nameErrortg.innerHTML = validate_name(newName);
    priceErrortg.innerHTML = validate_price(newPrice);
    summaryErrortg.innerHTML = validate_summary(newSummary);

    if(nameErrortg.innerHTML || priceErrortg.innerHTML || summaryErrortg.innerHTML){
        return;
    }


    let updated = false;
    const newInfo = {};
    if(p.name !== newName) {
        newInfo.name = newName;
        updated = true;
    }
    if(p.summary !== newSummary) {
        newInfo.summary = newSummary;
        updated = true;
    }
    if(p.price !== newPrice) {
        newInfo.price = Number(Number(newPrice).toFixed(2));
        updated = true;
    }
    if(imageFile2update){
        updated = true;
    }
    if(!updated){
        cancel(index);
        return;
    }

    //actual update
    try{
        if(imageFile2update){
            const imageRef2Del = firebase.storage().ref().child(IMAGE_FOLDER + p.image);
            await imageRef2Del.delete();
            const image = Date.now() + imageFile2update.name;
            const newImageRef = firebase.storage().ref(IMAGE_FOLDER + image);
            const taskSnapshot = await newImageRef.put(imageFile2update);
            const image_url = await taskSnapshot.ref.getDownloadURL();
            newInfo.image = image;
            newInfo.image_url = image_url;
        }

        await firebase.firestore().collection(COLLECTION).doc(p.docId).update(newInfo);
        window.location.href = '/show';
    }
    catch(e){
        gblPageContent.innerHTML = 'ERROR: ' + JSON.stringify(e);
    }
}
function cancel(index){
    const p = products[index];
    const card = document.getElementById(p.docId);
    card.innerHTML = cardOriginal;

    


}

async function deleteProduct(index){
    try{
        const p = products[index];
        await firebase.firestore().collection(COLLECTION).doc(p.docId).delete();
        const imageref = firebase.storage().ref().child(IMAGE_FOLDER + p.image);
        await imageref.delete();

        const card = document.getElementById(p.docId);
        card.parentNode.removeChild(card);

        delete products[index];

    }
    catch(e){
        gblPageContent.innerHTML = "ERROR: <br>" + JSON.stringify(e);
    }
}
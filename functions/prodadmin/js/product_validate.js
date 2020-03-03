function validate_name(name){
    if(!name || name.length < 2)
        return 'Error: MIN 2 CHARACTERS';
    else
        return null;
}
function validate_summary(summary){
    if(!summary || summary.length < 5)
        return 'Error: MIN 5 CHARACTERS';
    else
        return null;
}
function validate_price(price){
    if(!parseFloat(price))
        return `Error: INVALID VALUE FOR PRICE ${price}`;
    else
        return null;
}
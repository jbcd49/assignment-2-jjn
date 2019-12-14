let registeredUsers = [];
let activeUser = null;
let inventory = [];
let params = new URLSearchParams(location.search);
let guestCart = [];

window.onload = () =>
{
    if(localStorage.getItem("registeredUsers") !== null)
    {
        registeredUsers = JSON.parse(localStorage.getItem("registeredUsers"));
    }

    if(localStorage.getItem("activeUser") !== null)
    {
        activeUser = JSON.parse(localStorage.getItem("activeUser"));
        disableLoginFields();
        enableLogoutFields();
        setActiveUser();
        enableActiveUserFields();
    }
    else
    {
        if(localStorage.getItem("guestCart") !== null)
        {
            guestCart = JSON.parse(localStorage.getItem("guestCart"));
        }
    }
    
    //only render if on category page
    if(document.getElementById("itemList") !== null)
    {
        //if inventory is empty pull from json
        if(inventory.length === 0)
        {
            populateInventory();
        }
        filterItemList();
        renderItemList();
        renderSideBar();
        showSidebarReset();
    }

    if(document.getElementById("cartContainer") !== null)
    {
        renderCart();
    }

    if(document.getElementById("orderSummary") !== null)
    {
        renderOrderSummary();
    }

    attachListeners();
}

function renderOrderSummary()
{
    let cart = [];
    if( activeUser != null)
    {
        cart = activeUser.cart;
    }
    else
    {
        cart = guestCart;
    }
    populateInventory();
    
    let runningTotal = 0;
    let tempSubtotal = 0;
    for(let i = 0; i < cart.length; i++)
    {
        let tempInventoryItem = inventory[(parseInt(cart[i].tempItemID) - 1)];
        tempSubtotal += (parseFloat(tempInventoryItem.productPrice) * parseInt(cart[i].tempItemQty));
    }
    document.getElementById("subtotal").innerHTML = formatPriceString(tempSubtotal);
    runningTotal += tempSubtotal;

    const flatRateShipping = 4.99;
    document.getElementById("shipping").innerHTML = formatPriceString(flatRateShipping);
    runningTotal += flatRateShipping;

    const taxRate = 0.07;
    document.getElementById("tax").innerHTML = formatPriceString(taxRate * runningTotal);
    runningTotal *= (taxRate + 1);

    document.getElementById("total").innerHTML = formatPriceString(runningTotal);
    
    //set hidden field to pass value to placeorder
    document.getElementById("orderTotal").value = runningTotal.toFixed(2);
}

function placeOrder()
{
    if(isValidInputs())
    {
        let cart = [];
        let user = "guest";
        if( activeUser != null)
        {
            cart = activeUser.cart;
            user = activeUser.email;
        }
        else
        {
            cart = guestCart;
        }
        let ordersList = [];

        if(localStorage.getItem("ordersList") !== null)
        {
            ordersList = JSON.parse(localStorage.getItem("ordersList"));
        }

        ordersList.push({
            username: user,
            items: cart,
            total: document.getElementById("orderTotal").value,
            shippingInfo: 
            {
                fname: document.getElementById("checkoutFName").value,
                lname: document.getElementById("checkoutLName").value,
                address: document.getElementById("checkoutAddress").value,
                city: document.getElementById("checkoutCity").value,
                state: document.getElementById("checkoutState").value,
                zip: document.getElementById("checkoutZipcode").value,
            },
            billingInfo:
            {
                cardNumber: document.getElementById("checkoutCardNumber").value,
                cardMonth: document.getElementById("checkoutCardMonth").value,
                cardYear: document.getElementById("checkoutCardYear").value,
                cvv: document.getElementById("checkoutCardCvv").value
            }
        });

        localStorage.setItem("ordersList", JSON.stringify(ordersList));
        
        if(activeUser != null)
        {
            activeUser.cart = [];
            updateRegisteredUserCart(activeUser.email);
            saveUsersToLocalStorage();
            saveActiveUserToLocalStorage();
        }
        else
        {
            guestCart = [];
            saveGuestCart();
        }
        alert("ORDER PLACED, THANK YOU!");
        window.location.href = "./index.html";
    }
}

function isValidInputs()
{
    let validInputFlag = true;
    let invalidAlertString = "";
    
    let month = parseInt(document.getElementById("checkoutCardMonth").value);
    let year = parseInt(document.getElementById("checkoutCardYear").value);
    let date = new Date();
    if(month < 1 || month > 12)
    {
        validInputFlag = false;
        invalidAlertString += "INVALID - CREDIT CARD EXP. MONTH\n\n";
    }
    
    if(year < date.getFullYear())
    {
        validInputFlag = false;
        invalidAlertString += "INVALID - CREDIT CARD EXP. YEAR\n\n";
    }
    else if(year == date.getFullYear() && validInputFlag)
    {
        if(month < (date.getMonth() + 1))
        {
            validInputFlag = false;
            invalidAlertString += "EXPIRED - CREDIT CARD\n\n";
        }
    }

    let stateList = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
                     "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
                     "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
                     "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
                     "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
    let state = document.getElementById("checkoutState").value;
    if(!stateList.includes(state.toUpperCase()))
    {
        validInputFlag = false;
        invalidAlertString += "INVALID - STATE CODE";
    }

    if(!validInputFlag)
    {
        alert(invalidAlertString);
    }

    return validInputFlag;
}

function renderCart()
{
    populateInventory();
    document.getElementById("cartContainer").innerHTML = "";

    let cart = [];
    if( activeUser != null)
    {
        cart = activeUser.cart;
    }
    else
    {
        cart = guestCart;
    }

    let tempCartHandle = document.getElementById("cartContainer");

    //build headers
    let headerImage = document.createElement("div");
    headerImage.id = "imageHead";
    headerImage.className = "itemHeader";
    tempCartHandle.appendChild(headerImage);

    let headerName = document.createElement("div");
    headerName.id = "nameHead";
    headerName.className = "itemHeader";
    headerName.innerHTML = '<span id="imageHeader">ITEM</span>';
    tempCartHandle.appendChild(headerName);

    let headerPrice = document.createElement("div");
    headerPrice.id = "priceHead";
    headerPrice.className = "itemHeader";
    headerPrice.innerHTML = '<span id="imageHeader">PRICE</span>';
    tempCartHandle.appendChild(headerPrice);

    let headerQty = document.createElement("div");
    headerQty.id = "qtyHead";
    headerQty.className = "itemHeader";
    headerQty.innerHTML = '<span id="imageHeader">QTY</span>';
    tempCartHandle.appendChild(headerQty);

    let cartTotal = 0;
    //build items from cart
    for(let i = 0; i < cart.length; i++)
    {
        let tempInventoryItem = inventory[(parseInt(cart[i].tempItemID) - 1)];

        let tempImage = document.createElement("div");
        tempImage.className = "image";
        let tempImageElement = document.createElement("img");
        tempImageElement.src = tempInventoryItem.productImage;
        tempImageElement.width = "150";
        tempImageElement.height = "148";
        tempImage.appendChild(tempImageElement);
        tempCartHandle.appendChild(tempImage);

        let tempName = document.createElement("div");
        tempName.className = "name";
        tempName.innerHTML = '<p>'
            + tempInventoryItem.productBrand
            + '<br/>'
            + tempInventoryItem.productName
            + '</p>';
        tempCartHandle.appendChild(tempName);

        let tempPrice = document.createElement("div");
        tempPrice.className = "price";
        tempPrice.innerHTML = '<p>'
            + formatPriceString(parseFloat(tempInventoryItem.productPrice))
            + '</p>';
        tempCartHandle.appendChild(tempPrice);

        let tempQty = document.createElement("div");
        tempQty.className = "qty";
        
        let tempDecrement = document.createElement("button");
        tempDecrement.innerHTML = "-";
        tempDecrement.className = "btn btn-info btn-style qtyButton";
        tempDecrement.onclick = () => { decrementCartQty(tempInventoryItem.productID); };
        tempQty.appendChild(tempDecrement);

        let tempNum = document.createElement("div");
        tempNum.innerHTML = cart[i].tempItemQty;
        tempNum.className = "qtyNum";
        tempQty.appendChild(tempNum);

        let tempIncrement = document.createElement("button");
        tempIncrement.innerHTML = "+";
        tempIncrement.className = "btn btn-info btn-style qtyButton";
        tempIncrement.onclick = () => { incrementCartQty(tempInventoryItem.productID); };
        tempQty.appendChild(tempIncrement);

        let tempRemove = document.createElement("button");
        tempRemove.innerHTML = "Remove";
        tempRemove.className = "btn btn-danger btn-style removeButton";
        tempRemove.onclick = () => { removeCartItem(tempInventoryItem.productID); };
        tempQty.appendChild(tempRemove);
        
        tempCartHandle.appendChild(tempQty);

        cartTotal += (parseFloat(tempInventoryItem.productPrice) * parseInt(cart[i].tempItemQty));
    }

    let spacer1 = document.createElement("div");
    spacer1.id = "spacer";
    tempCartHandle.appendChild(spacer1);
    let totalLabel = document.createElement("div");
    totalLabel.id = "totalLabelDiv";
    totalLabel.innerHTML = "<span id='totalLabel'>SUBTOTAL: </span>";
    tempCartHandle.appendChild(totalLabel);
    let totalDiv = document.createElement("div");
    totalDiv.id = "totalDiv";
    totalDiv.innerHTML = formatPriceString(cartTotal);
    tempCartHandle.appendChild(totalDiv);

    let checkoutDiv = document.createElement("div");
    checkoutDiv.id = "checkoutDiv";
    let checkoutButton = document.createElement("button");
    checkoutButton.id = "checkoutButton";
    checkoutButton.innerHTML = "CHECKOUT";
    checkoutButton.className = "btn btn-info btn-style";
    checkoutButton.onclick = () => 
    {
        checkoutRedirect();
    };
    checkoutDiv.appendChild(checkoutButton);

    tempCartHandle.appendChild(checkoutDiv);

}

function checkoutRedirect()
{
    let cart = [];
    if( activeUser != null)
    {
        cart = activeUser.cart;
    }
    else
    {
        cart = guestCart;
    }
    if(cart.length == 0)
    {
        alert("NO ITEMS IN CART");
    }
    else
    {
        window.location.href = "./checkout.html";
    }
}

function incrementCartQty(id)
{
    updateCartQty(id, 1);
}

function decrementCartQty(id)
{
    updateCartQty(id, -1);
}

function updateCartQty(id, qtyChange)
{
    if(activeUser === null)
    {
        for(let i = 0; i < guestCart.length; i++)
        {
            if(guestCart[i].tempItemID == id)
            {
                guestCart[i].tempItemQty += qtyChange;
                if(guestCart[i].tempItemQty == 0)
                {
                    removeCartItem(id);
                }
                saveGuestCart();
                break;
            }
        }
    }
    else
    {
        for(let i = 0; i < activeUser.cart.length; i++)
        {
            if(activeUser.cart[i].tempItemID == id)
            {
                activeUser.cart[i].tempItemQty += qtyChange;
                if(activeUser.cart[i].tempItemQty == 0)
                {
                    removeCartItem(id);
                }
                updateRegisteredUserCart(activeUser.email);
                saveUsersToLocalStorage();
                saveActiveUserToLocalStorage();
                break;
            }
        }
    }
    renderCart();
}

function removeCartItem(id)
{
    if(activeUser === null)
    {
        guestCart = guestCart.filter( e => 
            {
                return e.tempItemID != id;
            });
        saveGuestCart();
    }
    else
    {
        activeUser.cart = activeUser.cart.filter( e => 
            {
                return e.tempItemID != id;
            });
        updateRegisteredUserCart(activeUser.email);
        saveUsersToLocalStorage();
        saveActiveUserToLocalStorage();
    }
    renderCart();
}

function formatPriceString(price)
{
    return '$' + price.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
}

function populateInventory()
{
    for(let i = 0; i < inventory_JSON.length; i++)
    {
        inventory.push(inventory_JSON[i]);
    }
}

function filterItemList()
{
    if(params.has('category'))
    {
        inventory = inventory.filter( e => 
            {
                return e.productCategory == params.get('category');
            });
    }
    if(params.has('brand'))
    {
        inventory = inventory.filter( e => 
            {
                return e.productBrand == params.get('brand');
            });

    }
    if(params.has('pricelowerlimit'))
    {
        switch(params.get("pricelowerlimit"))
        {
            case "0":
            {
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice <= 50;
                    });
                break;
            }
            case "50":
            {
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice >= 50;
                    });
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice <= 100;
                    })
                break;
            }
            case "100":
            {
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice >= 100;
                    });
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice <= 200;
                    })
                break;
            }
            case "200":
            {
                inventory = inventory.filter(e => 
                    {
                        return e.productPrice >= 200;
                    });
                break;
            }
        }

    }
}

function filterRedirect(filterOption, filterString)
{
    let urlString = "./category.html?"

    //append filters here
    if(filterOption == "category")
    {
        if(filterString !== "reset")
        {
            urlString += "category=" + filterString + "&";
        }
    }
    else
    {
        if(params.has("category"))
        {
            urlString += "category=" + params.get("category") + "&";
        }
    }

    if(filterOption == "brand")
    {
        if(filterString !== "reset")
        {
            urlString += "brand=" + filterString + "&";
        }
    }
    else
    {
        if(params.has("brand"))
        {
            urlString += "brand=" + params.get("brand") + "&";
        }
    }

    if(filterOption == "pricelowerlimit")
    {
        if(filterString !== "reset")
        {
            urlString += "pricelowerlimit=" + filterString + "&"
        }
    }
    else
    {
        if(params.has("pricelowerlimit"))
        {
            urlString += "pricelowerlimit=" + params.get("pricelowerlimit") + "&"
        }
    }

    window.location.href = urlString;
}

function renderItemList()
{
    let temp = document.getElementById("itemList");
    for(let i = 0; i < inventory.length; i++)
    {
        let tempItem = document.createElement("div");
        tempItem.className = "item";
        tempItem.id = inventory[i].productID;

        let tempImage = document.createElement("img");
        tempImage.src = inventory[i].productImage;
        tempImage.className = "itemImage";

        let tempName = document.createElement("div");
        tempName.innerHTML = inventory[i].productBrand + "<br>" + inventory[i].productName;
        tempName.className = "itemName";

        let tempPrice = document.createElement("div");
        tempPrice.className = "itemPrice";
        tempPrice.innerHTML = formatPriceString(parseFloat(inventory[i].productPrice));

        let tempCartForm = document.createElement("div");
        tempCartForm.className = "itemCartForm";

        let tempForm = document.createElement("form");
        tempForm.setAttribute("onsubmit", "return false");

        let tempSelect = document.createElement("select");
        tempSelect.className = "itemQty";
        tempSelect.id = inventory[i].productID + "Qty";
        for(let i = 1; i < 4; i++)
        {
            let tempOption = document.createElement("option");
            tempOption.value = i;
            tempOption.text = i;
            tempSelect.appendChild(tempOption);
        }

        let tempButton = document.createElement("button");
        tempButton.innerHTML = "Add To Cart";
        tempButton.className = "btn btn-info btn-style";
        tempButton.style.height = "35px";
        tempButton.style.marginBottom = "5px";

        tempForm.addEventListener("submit", () => {
            addToCart(tempItem.id, tempSelect.id);
        });

        tempForm.appendChild(tempSelect);
        tempForm.appendChild(tempButton);
        tempCartForm.appendChild(tempForm);

        tempItem.appendChild(tempImage);
        tempItem.appendChild(tempName);
        tempItem.appendChild(tempPrice);
        tempItem.appendChild(tempCartForm);

        temp.appendChild(tempItem);
    }
}

function renderSideBar()
{
    //build side bar off of filtered item list
    let categoryList = [];
    let brandList = [];
    for(let i = 0; i < inventory.length; i++)
    {
        if(!categoryList.includes(inventory[i].productCategory))
        {
            categoryList.push(inventory[i].productCategory);
        }
        if(!brandList.includes(inventory[i].productBrand))
        {
            brandList.push(inventory[i].productBrand);
        }
    }

    let headerUL = document.createElement("ul");
    headerUL.id = "headerUL";

    //category
    let categoryHeader = document.createElement("li");
    categoryHeader.innerHTML = "CATEGORY <span id='categoryReset' class='filterReset'> - CLEAR</span>";
    categoryHeader.className = "sidebarHeader";
    headerUL.appendChild(categoryHeader);

    let categoryUL = document.createElement("ul");
    for(let i = 0; i < categoryList.length; i++)
    {
        let tempLI = document.createElement("li");
        tempLI.innerHTML = categoryList[i];
        tempLI.style.cursor = "pointer";
        tempLI.onclick = () =>
        {
            filterRedirect("category", categoryList[i]);
        };
        categoryUL.appendChild(tempLI);
    }

    let categoryLI = document.createElement("li");
    categoryLI.appendChild(categoryUL);
    headerUL.appendChild(categoryLI);


    //brand
    let brandHeader = document.createElement("li") 
    brandHeader.innerHTML = "BRAND <span id='brandReset' class='filterReset'> - CLEAR</span>";
    brandHeader.className = "sidebarHeader";
    headerUL.appendChild(brandHeader);

    let brandUL = document.createElement("ul");
    for(let i = 0; i < brandList.length; i++)
    {
        let tempLI = document.createElement("li");
        tempLI.innerHTML = brandList[i];
        tempLI.style.cursor = "pointer";
        tempLI.onclick = () =>
        {
            filterRedirect("brand", brandList[i]);
        };
        brandUL.appendChild(tempLI);
    }

    let brandLI = document.createElement("li");
    brandLI.appendChild(brandUL);
    headerUL.appendChild(brandLI);

    //price
    let priceHeader = document.createElement("li");
    priceHeader.innerHTML = "PRICE <span id='priceReset' class='filterReset'> - CLEAR</span>";
    priceHeader.className = "sidebarHeader";
    headerUL.appendChild(priceHeader);

    let priceUL = document.createElement("ul");

    let price0to50 = document.createElement("li");
    price0to50.innerHTML = "Under $50";
    price0to50.style.cursor = "pointer";
    price0to50.onclick = () =>
    {
        filterRedirect("pricelowerlimit", "0");
    };
    price0to50.id = "price0to50";
    priceUL.appendChild(price0to50);

    let price50to100 = document.createElement("li");
    price50to100.innerHTML = "$50 to $100";
    price50to100.style.cursor = "pointer";
    price50to100.onclick = () =>
    {
        filterRedirect("pricelowerlimit", "50");
    };
    price50to100.id = "price50to100";
    priceUL.appendChild(price50to100);

    let price100to200 = document.createElement("li");
    price100to200.innerHTML = "$100 to $200";
    price100to200.style.cursor = "pointer";
    price100to200.onclick = () =>
    {
        filterRedirect("pricelowerlimit", "100");
    };
    price100to200.id = "price100to200";
    priceUL.appendChild(price100to200);

    let price200toMax = document.createElement("li");
    price200toMax.innerHTML = "$200 & Up";
    price200toMax.style.cursor = "pointer";
    price200toMax.onclick = () =>
    {
        filterRedirect("pricelowerlimit", "200");
    };
    price200toMax.id = "price200toMax";
    priceUL.appendChild(price200toMax);

    if(params.has("pricelowerlimit"))
    {
        switch(params.get("pricelowerlimit"))
        {
            case "0":
            {
                priceUL.removeChild(price50to100);
                priceUL.removeChild(price100to200);
                priceUL.removeChild(price200toMax);
                break;
            }
            case "50":
            {   
                priceUL.removeChild(price0to50);
                priceUL.removeChild(price100to200);
                priceUL.removeChild(price200toMax);
                break;
            }
            case "100":
            {
                priceUL.removeChild(price0to50);
                priceUL.removeChild(price50to100);
                priceUL.removeChild(price200toMax);
                break;
            }
            case "200":
            {
                priceUL.removeChild(price0to50);
                priceUL.removeChild(price50to100);
                priceUL.removeChild(price100to200);
                break;
            }
        }
    }

    headerUL.appendChild(priceUL);

    document.getElementById("sideBarList").appendChild(headerUL);
}

function showSidebarReset()
{
    if(params.has("category"))
    {
        if(document.getElementById("categoryReset") !== null)
        {
            document.getElementById("categoryReset").style.display = "inline";
            document.getElementById("categoryReset").onclick = () =>
            {
                filterRedirect("category", "reset");
            };
        }
    }
    if(params.has("brand"))
    {
        if(document.getElementById("brandReset") !== null)
        {
            document.getElementById("brandReset").style.display = "inline";
            document.getElementById("brandReset").onclick = () =>
            {
                filterRedirect("brand", "reset");
            };
        }
    }
    if(params.has("pricelowerlimit"))
    {
        if(document.getElementById("priceReset") !== null)
        {
            document.getElementById("priceReset").style.display = "inline";
            document.getElementById("priceReset").onclick = () =>
            {
                filterRedirect("pricelowerlimit", "reset");
            };
        }
    }
}

function attachListeners()
{    
    document.getElementById("loginForm").addEventListener("submit", () => {
        loginUser(document.getElementById("loginEmail").value, document.getElementById("loginPassword").value);
    });

    document.getElementById("logoutButton").addEventListener("click", () => {
        logoutUser();
    });

    if(document.getElementById("signUpButton") !== null)
    {
        document.getElementById("signUpButton").addEventListener("click", () => {
            window.location.href = "./registration.html";
        });
    }

    if(document.getElementById("registerForm") !== null)
    {
        document.getElementById("registerForm").addEventListener("submit", () => {
            registerUser();
        });
    }

    if(document.getElementById("checkoutForm") !== null)
    {
        document.getElementById("checkoutForm").addEventListener("submit", () => {
            placeOrder();
        });
    }
}

function addToCart(itemID, itemQtySelect)
{
    let tempCartItem = 
    {
        tempItemID: itemID,
        tempItemQty: parseInt(document.getElementById(itemQtySelect).value)
    }
    if(activeUser === null)
    {
        //add to guest cart
        if(!isItemInCart(guestCart, itemID))
        {
            guestCart.push(tempCartItem);
        }
        else
        {
            for(let i = 0; i < guestCart.length; i++)
            {
                if(guestCart[i].tempItemID == itemID)
                {
                    guestCart[i].tempItemQty += tempCartItem.tempItemQty;
                    break;
                }
            }
        }
        saveGuestCart();
    }
    else
    {
        //add to user cart
        if(!isItemInCart(activeUser.cart, itemID))
        {
            activeUser.cart.push(tempCartItem);
        }
        else
        {
            for(let i = 0; i < activeUser.cart.length; i++)
            {
                if(activeUser.cart[i].tempItemID == itemID)
                {
                    activeUser.cart[i].tempItemQty += tempCartItem.tempItemQty;
                    break;
                }
            }
        }
        
        updateRegisteredUserCart(activeUser.email);
        saveUsersToLocalStorage();
        saveActiveUserToLocalStorage();
    }
}

function updateRegisteredUserCart(email)
{
    for(user of registeredUsers)
    {
        if(user.email === email)
        {
            user.cart = activeUser.cart;
            break;
        }
    }
}

function isItemInCart(cart, itemID)
{
    for(let i = 0; i < cart.length; i++)
    {
        if(cart[i].tempItemID == itemID)
        {
            return true;
        }
    }
    return false;
}

function registerUser()
{
    if(isUserRegistered())
    {
        alert("USER ALREADY EXISTS");
        return; 
    }    
    if(!isUserInfoValid())
    {
        alert("PASSWORDS DO NOT MATCH");
        return;
    }

    createUser();
    
    loginUser(document.getElementById("registerEmail").value, document.getElementById("registerPassword1").value);
    alert("USER CREATED");
    window.location.href = "./index.html";
}

function isUserInfoValid()
{
    if(document.getElementById("registerPassword1").value !== document.getElementById("registerPassword2").value)
    {
        return false;
    }
    else
    {
        return true;
    }
}

function isUserRegistered()
{
    let isUserInList = false;
    for(user of registeredUsers)
    {
        if(user.email === document.getElementById("registerEmail").value)
        {
            isUserInList = true;
            break;
        }
    }
    if(!isUserInList)
    {
        return false;        
    }
    else
    {
        return true;
    }
}

function createUser()
{
    let newUser = 
    {
        email: document.getElementById("registerEmail").value,
        password: document.getElementById("registerPassword1").value,
        cart: []
    }

    registeredUsers.push(newUser);
    saveUsersToLocalStorage();
}

function saveUsersToLocalStorage()
{
    localStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
}

function saveActiveUserToLocalStorage()
{
    localStorage.setItem("activeUser", JSON.stringify(activeUser));
}

function setActiveUser()
{
    document.getElementById("usernameLabel").innerHTML = activeUser.email;
}

function saveGuestCart()
{
    localStorage.setItem("guestCart", JSON.stringify(guestCart));
}

function loginUser(email, password)
{
    for(user of registeredUsers)
    {
        if(user.email === email)
        {
            if(user.password === password)
            {
                disableLoginFields();
                enableLogoutFields();

                activeUser = user;
                saveActiveUserToLocalStorage();
                setActiveUser();
                enableActiveUserFields();

                mergeCarts();
                if(document.getElementById("cartContainer") !== null)
                {
                    renderCart();
                }
                if(document.getElementById("checkoutContainer") !== null)
                {
                    window.location.href = "./cart.html";
                }

                return;
            }
            else
            {
                alert("PASSWORD IS INCORRECT");
            }
            return;
        }
    }
    alert("USER DOES NOT EXIST");
}

function mergeCarts()
{
    if(guestCart.length > 0)
    {
        let mergeFlag = true;
        if(activeUser.cart.length > 0)
        {
            mergeFlag = confirm("Merge Items In Cart With Saved Items?");
        }

        if(mergeFlag)
        {
            for(let i = 0; i < guestCart.length; i++)
            {
                if(!isItemInCart(activeUser.cart, guestCart[i].tempItemID))
                {
                    activeUser.cart.push(guestCart[i]);
                }
                else
                {
                    for(let j = 0; j < activeUser.cart.length; j++)
                    {
                        if(activeUser.cart[j].tempItemID == guestCart[i].tempItemID)
                        {
                            activeUser.cart[j].tempItemQty += guestCart[i].tempItemQty;
                            break;
                        }
                    }
                }
            }
        }
        else
        {
            if(confirm("Replace Saved Items With Items In Cart?"))
            {
                activeUser.cart = [];
                for(let i = 0; i < guestCart.length; i++)
                {
                    activeUser.cart.push(guestCart[i]);
                }
            }
        }
    }
    updateRegisteredUserCart();
    saveUsersToLocalStorage();
    saveActiveUserToLocalStorage();
    resetGuest();
}

function resetGuest()
{
    guestCart = [];
    if(localStorage.getItem("guestCart") !== null)
    {
        localStorage.removeItem("guestCart");
    }
}

function logoutUser()
{
    enableLoginFields();
    disableLogoutFields();
    disableActiveUserFields();
    activeUser = null;
    localStorage.removeItem("activeUser");
    if(document.getElementById("cartContainer") !== null)
    {
        renderCart();
    }
    if(document.getElementById("checkoutContainer") !== null)
    {
        window.location.href = "./index.html";
    }
}

function disableLoginFields()
{
    document.getElementById("loginButton").style.display = "none";
    document.getElementById("loginEmail").style.display = "none";
    document.getElementById("loginPassword").style.display = "none";
    if(document.getElementById("signUpButton") !== null)
    {
        document.getElementById("signUpButton").style.display = "none";
    }
}

function enableLoginFields()
{
    document.getElementById("loginButton").style.display = "inline";
    document.getElementById("loginEmail").style.display = "inline";
    document.getElementById("loginPassword").style.display = "inline";
    if(document.getElementById("signUpButton") !== null)
    {
        document.getElementById("signUpButton").style.display = "inline";
    }
}

function disableLogoutFields()
{
    document.getElementById("logoutButton").style.display = "none";
}

function enableLogoutFields()
{
    document.getElementById("logoutButton").style.display = "inline";
}

function enableActiveUserFields()
{
    document.getElementById("usernameLabel").style.display = "inline";
}

function disableActiveUserFields()
{
    document.getElementById("usernameLabel").style.display = "none";
}

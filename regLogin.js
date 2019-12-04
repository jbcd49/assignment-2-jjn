let registeredUsers = [];
let activeUser = null;
let inventory = [];

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

    if(localStorage.getItem("inventory") !== null)
    {
        inventory = JSON.parse(localStorage.getItem("inventory"));
    }
    else
    {
        generateItemsForInventory();
    }

    renderItemList();

    attachListeners();
}

function generateItemsForInventory()
{
    //TODO - check for items in carts

    const INVENTORY_SIZE = 25; //temp size limit
    for(let i = 0; i < INVENTORY_SIZE; i++)
    {
        //TODO - loop if in list to avoid duplicate listings

        //temp - create the items and push to the inventory
        inventory.push(i);
    }
    saveInventoryToLocalStorage();
}

function renderItemList()
{
    let temp = document.getElementById("itemList");
    for(let i = 0; i < inventory.length; i++)
    {
        let tempItem = document.createElement("div");
        tempItem.className = "item";

        let tempImage = document.createElement("img");
        //temp - img will be pulled from inventory item field
        tempImage.src = "./resources/testImage.jpg";
        tempImage.className = "itemImage";

        let tempPrice = document.createElement("div");
        tempPrice.className = "itemPrice";

        let tempCartForm = document.createElement("div");
        tempCartForm.className = "itemCartForm";

        tempItem.appendChild(tempImage);
        tempItem.appendChild(tempPrice);
        tempItem.appendChild(tempCartForm);

        temp.appendChild(tempItem);
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
        password: document.getElementById("registerPassword1").value
        //TODO - add cart here for user
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

function saveInventoryToLocalStorage()
{
    localStorage.setItem("inventory", JSON.stringify(inventory));
}

function setActiveUser()
{
    document.getElementById("usernameLabel").innerHTML = activeUser.email;
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

                //TODO - move any items in the cart to the users cart -- may need to merge items in the cart
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

function logoutUser()
{
    enableLoginFields();
    disableLogoutFields();
    disableActiveUserFields();
    activeUser = null;
    localStorage.removeItem("activeUser");
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

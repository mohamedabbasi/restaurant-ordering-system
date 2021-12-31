let restaurants = {};
let currentRestaurant = {};
let order = {};
let restArray = {};

// An XMLHttpRequest from here to retrieve the array of restaurant names.
function genDropDownList(restaurants) {
    let result = '<select name="restaurant-select" id="restaurant-select">';
    result += '<option value="none">Select a Restaurant</option>';
    Object.keys(restaurants).forEach(elem => { // Generate new HTML for a drop-down list containing all restaurants.
        result += `<option value="${elem}">${restaurants[elem].name}</option>`
    });
    result += "</select>";
    return result;
}

// An XMLHttpRequest here to retrieve the menu data for the selected restaurant
function selectRestaurant(event) {
    let select = event.target;
    let selectedValue = select.value;
    let request = new XMLHttpRequest();
    let result = true;
    // If order is not empty, confirm the user wants to switch restaurants.
    if (!isEmpty(order) && selectedValue !== "none") {
        result = confirm("Are you sure you want to clear your order and switch menus?");
    } if (result && selectedValue !== "none") {
        request.open("GET", "./restaurant.txt", true);
        request.onload = function() {
            if (request.status === 200) {
                restaurants = JSON.parse(request.responseText);
            }
        }
        request.send();
        currentRestaurant = restaurants[selectedValue];
        // Updating the page contents to contain the new menu
        document.getElementById("left").innerHTML = getCategoryHTML(currentRestaurant);
        document.getElementById("middle").innerHTML = getMenuHTML(currentRestaurant);

        order = {}; // Clear the current oder and update the order summary
        updateOrder();

        // Updating the restaurant info on the page
        let info = document.getElementById("info");
        info.innerHTML = currentRestaurant.name + "<br>Minimum Order: $" + currentRestaurant.min_order + "<br>Delivery Fee: $" + currentRestaurant.delivery_fee + "<br><br>";
    } else {
        selectedValue = event.target.value;
    }
}

// Given a restaurant object, produces HTML for the left column
function getCategoryHTML(rest) {
    let menu = rest.menu;
    let result = "<b>Categories<b><br>";
    Object.keys(menu).forEach(key => {
        result += `<a href="#${key}">${key}</a><br>`;
    });
    return result;
}

// Given a restaurant object, produces the menu HTML for the middle column
function getMenuHTML(rest) {
    let menu = rest.menu;
    let result = "";
    // For each category in the menu
    Object.keys(menu).forEach(key => {
        result += `<h3><u>${key}</h3></u><a name="${key}"></a><br>`;
        // For each menu item in the category
        Object.keys(menu[key]).forEach(id => {
            item = menu[key][id];
            result += `<b>${item.name}</b> (\$${item.price}) <img src='add.png' style='height:20px;vertical-align:bottom;cursor:pointer;' onclick='addItem(${id})'/> <br>`;
            result += item.description + "<br><br>";
        });
    });
    return result;
}

// Responsible for adding one of the item with given id to the order and updating the summary
function addItem(id) {
    if (order.hasOwnProperty(id)) {
        order[id] += 1;
    } else {
        order[id] = 1;
    } updateOrder();
}

// Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id) {
    if (order.hasOwnProperty(id)) {
        order[id] -= 1;
        if (order[id] <= 0) {
            delete order[id];
        } updateOrder();
    }
}

function updateOrder() {
    let result = "";
    let subtotal = 0;
    let orderInfo = {};
    let numOrder = []
    Object.keys(order).forEach(id => {
        let item = getItemById(id);
        let qty = order[id];
        numOrder.push(item.name);
        subtotal += (item.price * order[id]);
        result += `${item.name} × ${order[id]} (${(item.price * order[id]).toFixed(2)}) <img src='remove.png' style='height:15px;vertical-align:bottom;cursor:pointer;' onclick='removeItem(${id})'/><br>`;
        restArray["subtotal"] = (subtotal);
        restArray["fee"] = parseInt(currentRestaurant.delivery_fee);
        restArray["tax"] = parseInt(subtotal*0.1);
        orderInfo[numOrder.length] = `quantity: ${qty}, name: ${item.name}`;
        restArray["order"] = orderInfo;
    });
    // Add the summary fields to the result HTML, rounding to two decimal places
    result += `Subtotal: \$${subtotal.toFixed(2)}<br>`;
    result += `Tax: \$${(subtotal*0.1).toFixed(2)}<br>`;
    result += `Delivery Fee: \$${currentRestaurant.delivery_fee.toFixed(2)}<br>`;
    let total = subtotal + (subtotal * 0.1) + currentRestaurant.delivery_fee;
    result += `Total: \$${total.toFixed(2)}<br><br>`;
    restArray["restaurantID"] = currentRestaurant.id;
    restArray["restaurantName"] = currentRestaurant.name;
    restArray["total"] = parseInt(total.toFixed(2));

    // Decide whether to show the Submit Order button or the Order X more label
    if (subtotal >= currentRestaurant.min_order) {
        result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button><br><br>`
    } else {
        result += `Add \$${(currentRestaurant.min_order - subtotal).toFixed(2)} more to your order.<br><br>`;
    }
    document.getElementById("right").innerHTML = result;
}

// XMLHttpRequest for submitOrder()
function submitOrder() {
    // Submit the order using XMLHTTPRequest to a new file.
    let request = new XMLHttpRequest();
    request.open("POST", "order", true);
    request.onload = function() {
        if (request.status === 200) {
            alert("Order placed!");
            window.location.href = "/order";
        }
    }
    request.setRequestHeader("Content-type", "application/json");
    request.send(JSON.stringify(restArray));
    order = {}
    restArray = {};
}

function init() {
    const request = new XMLHttpRequest();
    request.open("GET", "./restaurant.txt", true);
    request.onload = function() {
        if (request.status === 200) {
            restaurants = JSON.parse(request.responseText);
            document.getElementById("restaurant-select").innerHTML = genDropDownList(restaurants);
            let select = document.getElementById("restaurant-select");
            select.setAttribute("onchange", "selectRestaurant(event)");
        }
    }
    request.send();
}

// Helper function. Given an ID of an item in the current restaurant's menu, returns that item object if it exists.
function getItemById(id) {
    let categories = Object.keys(currentRestaurant.menu);
    for (let i = 0; i < categories.length; i++) {
        if (currentRestaurant.menu[categories[i]].hasOwnProperty(id)) {
            return currentRestaurant.menu[categories[i]][id];
        }
    } return null;
}

// Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    } return true;
}

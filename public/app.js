const toCurrency = price => {
    return new Intl.NumberFormat('en-EN', {
        currency: 'usd', 
        style: 'currency'
    }).format(price)
}

const toDate = date => {
    return new Intl.DateTimeFormat('en-EN', {
        day: '2-digit',
        month: 'long', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    }).format(new Date(date))
}

// Making needed style for date
document.querySelectorAll('.date').forEach(node => {
    node.textContent = toDate(node.textContent)
})

// Making needed style for prices
document.querySelectorAll('.price').forEach(node => {
    node.textContent = toCurrency(node.textContent)
})

// Deleting items from the cart on the client side
// using DELETE request
const $cart = document.querySelector('#cart')

if ($cart) {
    $cart.addEventListener('click', event => {
        
        if (event.target.classList.contains('js-remove')) {
            
            const id = event.target.dataset.id
            const csrf = event.target.dataset.csrf
            
            // AJAX request for needed route
            // to rerender cart items asynchronously
            fetch('/cart/remove/' + id, {
                method: 'delete',
                headers: {
                    'X-XSRF-TOKEN': csrf
                }
            }).then(res => res.json())
              .then(cart => {
                  if (cart.courses.length) {
                    const html = cart.courses.map(c => {
                        return `
                        <tr>
                            <td>${c.title}</td>
                            <td>${c.count}</td>
                            <td>
                                <button class="btn btn-small js-remove" data-id="${c.id}">Delete</button>
                            </td>
                        </tr>
                        `
                    }).join('')
                    $cart.querySelector('tbody').innerHTML = html
                    $cart.querySelector('.price').textContent = toCurrency(cart.price)
                  } else {
                      $cart.innerHTML = '<p>Cart is empty</p>'
                  }
              })
        }
    })
}

M.Tabs.init(document.querySelectorAll('.tabs'))
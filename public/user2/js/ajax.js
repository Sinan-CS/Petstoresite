function add_to_cart(proId){
    $.ajax({
        url:'/add-tocart/'+proId,
        method:'get',   
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                counts=parseInt(count)+1
                $('#cart-count').html(counts)
            }
            
        }
    })
}
$('#checkoutForm').submit((e) => {
    e.preventDefault()
   
    $.ajax({
      url: '/placeOrder',
      method: 'post',
      data: $('#checkoutForm').serialize(),
      success: (response) => {
        if (response.codSuccess) {
        //   location.href = '/viewOrderDetails'
        }
        alert(response)
      }
    })
  });
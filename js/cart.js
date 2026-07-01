<div class="invoice-signature">
        <span>Reviewed By</span>
        <div>Name / Signature</div>
      </div>

      <div class="invoice-signature">
        <span>Received By</span>
        <div>Name / Signature</div>
      </div>
    </div>
  `;
}

function createInvoicePage(pageItems,startIndex,pageNumber,totalPages,invoiceNo,invoiceDate,customerName,isLastPage){
  return `
    <section class="invoice-page">
      ${createInvoiceHeader(invoiceNo,invoiceDate,customerName)}
      ${createInvoiceTable(pageItems,startIndex)}
      ${isLastPage ? createInvoiceFooter() : ""}
      <div class="invoice-page-number">Page ${pageNumber} / ${totalPages}</div>
    </section>
  `;
}

function renderInvoicePages(invoiceNo,invoiceDate,customerName){
  const itemsPerPage = ROWS_PER_INVOICE_PAGE * COLUMNS_PER_INVOICE_ROW;
  const totalPages = Math.max(1,Math.ceil(cart.length / itemsPerPage));
  let pagesHTML = "";

  for(let pageIndex = 0; pageIndex < totalPages; pageIndex++){
    const startIndex = pageIndex * itemsPerPage;
    const pageItems = cart.slice(startIndex,startIndex + itemsPerPage);
    const isLastPage = pageIndex === totalPages - 1;

    pagesHTML += createInvoicePage(
      pageItems,
      startIndex,
      pageIndex + 1,
      totalPages,
      invoiceNo,
      invoiceDate,
      customerName,
      isLastPage
    );
  }

  invoiceTemplate.innerHTML = pagesHTML;
}

function waitForImages(container){
  const images = container.querySelectorAll("img");

  return Promise.all(Array.from(images).map(img=>{
    return new Promise(resolve=>{
      if(img.complete){
        resolve();
        return;
      }

      img.onload = ()=>resolve();
      img.onerror = ()=>resolve();
      setTimeout(resolve,2000);
    });
  }));
}

async function waitForFonts(){
  if(!document.fonts || !document.fonts.ready){
    return;
  }

  await Promise.race([
    document.fonts.ready,
    new Promise(resolve=>setTimeout(resolve,1800))
  ]);
}

async function createInvoice(){
  if(cart.length === 0){
    alert("السلة فارغة");
    return;
  }

  if(!invoiceTemplate){
    alert("قالب الفاتورة غير موجود في الصفحة");
    return;
  }

  const invoiceNo = makeInvoiceNumber();
  const invoiceDate = formatInvoiceDate();
  const customerName = getInvoiceCustomerName();

  renderInvoicePages(invoiceNo,invoiceDate,customerName);

  await waitForFonts();
  await waitForImages(invoiceTemplate);

  const pages = Array.from(invoiceTemplate.querySelectorAll(".invoice-page"));
  const pdf = new window.jspdf.jsPDF("P","mm","A4");

  for(let index = 0; index < pages.length; index++){
    const page = pages[index];

    const canvas = await html2canvas(page,{
      scale:2,
      useCORS:true,
      backgroundColor:"#ffffff",
      width:page.offsetWidth,
      height:page.offsetHeight,
      windowWidth:page.scrollWidth,
      windowHeight:page.scrollHeight
    });

    const imgData = canvas.toDataURL("image/png");

    if(index > 0){
      pdf.addPage();
    }

    pdf.addImage(imgData,"PNG",0,0,210,297);
  }

  pdf.save(`${invoiceNo}.pdf`);
}

if(cartItems){
  cartItems.addEventListener("click",event=>{
    const button = event.target.closest("button[data-action]");
    if(!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if(action === "increase") increaseQty(id);
    if(action === "decrease") decreaseQty(id);
    if(action === "delete") deleteItem(id);
  });

  cartItems.addEventListener("change",event=>{
    const input = event.target.closest(".qty-input");
    if(!input) return;

    updateQty(input.dataset.id,input.value);
  });
}

if(cartSearch){
  cartSearch.addEventListener("input",renderCart);
}

const createInvoiceButton = document.getElementById("createInvoice");

if(createInvoiceButton){
  createInvoiceButton.addEventListener("click",createInvoice);
}

const whatsappButton = document.getElementById("whatsappBtn");

if(whatsappButton){
  whatsappButton.addEventListener("click",()=>{
    window.open("https://wa.me/966538647362","_blank");
  });
}

renderCart();

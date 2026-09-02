// Default items matching original invoice
const defaultItems = [
  { desc: "Electric work with matreialmodel no60 (Machine provide by me)", qty: 1, unit: 1200 },
  { desc: "ducting work with matreial", qty: "", unit: "" },
  { desc: "copper work with commisining", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" },
  { desc: "", qty: "", unit: "" }
];

window.onload = function () {
  document.getElementById('invoiceDate').valueAsDate = new Date();
  let lastInvNo = parseInt(localStorage.getItem('lastInvoiceNo')) || 46237;
  document.getElementById('invoiceNo').value = lastInvNo + 1;
  renderRows();
};

function renderRows() {
  const tbody = document.getElementById('itemsBody');
  tbody.innerHTML = '';
  
  defaultItems.forEach((item, index) => {
    let row = `<tr>
      <td><input type="text" value="${item.desc}" id="desc_${index}"></td>
      <td><input type="number" value="${item.qty}" id="qty_${index}" oninput="calculateTotals()"></td>
      <td><input type="number" value="${item.unit}" id="unit_${index}" oninput="calculateTotals()"></td>
      <td id="total_${index}">0.000</td>
    </tr>`;
    tbody.innerHTML += row;
  });
  calculateTotals();
}

function calculateTotals() {
  let subtotal = 0;

  for (let i = 0; i < defaultItems.length; i++) {
    let qty = parseFloat(document.getElementById(`qty_${i}`).value) || 0;
    let unit = parseFloat(document.getElementById(`unit_${i}`).value) || 0;
    let total = qty * unit;
    
    document.getElementById(`total_${i}`).innerText = total.toFixed(3);
    subtotal += total;
  }

  document.getElementById('subtotal').innerText = subtotal.toFixed(3);

  let discount = parseFloat(document.getElementById('discount').value) || 0;
  let handling = parseFloat(document.getElementById('handling').value) || 0;
  let installation = parseFloat(document.getElementById('installation').value) || 0;

  let grandTotal = subtotal - discount + handling + installation;
  document.getElementById('totalAmount').innerText = "KWD " + grandTotal.toFixed(3);
}

function saveAndPrint() {
  const invoiceNo = document.getElementById('invoiceNo').value;
  const date = document.getElementById('invoiceDate').value;
  const clientName = document.getElementById('contactName').value || document.getElementById('clientCompany').value;
  const mobile = document.getElementById('clientPhone').value;
  const grandTotal = document.getElementById('totalAmount').innerText;

  if (!clientName) {
    alert("Please enter Customer Name or Company Name");
    return;
  }

  // 1. Save entry to Statement of Account
  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];
  statement.push({
    "Date": date,
    "Invoice No": invoiceNo,
    "Customer Name": clientName,
    "Mobile No": mobile,
    "Total Amount": grandTotal
  });
  localStorage.setItem('invoiceStatement', JSON.stringify(statement));

  // 2. Save Next Invoice Number
  localStorage.setItem('lastInvoiceNo', invoiceNo);

  // 3. Generate 1-Page PDF
  const element = document.getElementById('invoice');
  const opt = {
    margin:       0,
    filename:     `Inv-${invoiceNo}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    location.reload();
  });
}

function exportStatement() {
  let statement = JSON.parse(localStorage.getItem('invoiceStatement')) || [];

  if (statement.length === 0) {
    alert("No records found!");
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(statement);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Statement of Account");

  XLSX.writeFile(workbook, "Statement_of_Account.xlsx");
}

function resetForm() {
  location.reload();
}

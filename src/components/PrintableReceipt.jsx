import React, { forwardRef } from "react";

const PrintableReceipt = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const items = order.items || [];
  const totalQty = items.reduce(
    (sum, item) => sum + Number(item.quantity || 1),
    0
  );

  return (
    <div ref={ref} className="receipt-container">
      <style media="print">{`
        @page {
          size: 58mm auto;
          margin: 0;
        }

        html, body {
          margin: 0;
          padding: 0;
          background: #fff;
        }

        .receipt-container {
          width: 58mm;
          padding: 3mm;
          color: #000;
          font-family: Courier New, monospace;
          font-size: 11px;
          box-sizing: border-box;
          font-weight: 900 !important; /* Forces bold */
        }

        /* Forces all child elements inside the receipt to be ultra bold */
        .receipt-container * {
          font-weight: 900 !important; 
        }

        * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      `}</style>

      <style>{`
        .receipt-container {
          width: 48mm;
          padding: 3mm;
          background: #fff;
          color: #000;
          font-family: Courier New, monospace;
          font-size: 11px;
          line-height: 1.35;
          box-sizing: border-box;
          font-weight: 900 !important; /* Forces bold for preview */
        }

        /* Forces all child elements inside the receipt preview to be ultra bold */
        .receipt-container * {
          font-weight: 900 !important; 
        }

        .center {
          text-align: center;
        }

        .bold {
          font-weight: 900 !important;
        }

        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }

        .row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 6px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        td {
          vertical-align: top;
          padding: 2px 0;
        }

        .qty {
          width: 18%;
        }

        .item {
          width: 82%;
          word-break: break-word;
        }

        .note {
          font-size: 9px;
          margin-top: 2px;
        }
      `}</style>

      {/* Header */}
      <div className="center bold" style={{ fontSize: 16 }}>
        VALO KITCHEN
      </div>

      <div className="center">
        Kitchen Order Ticket
      </div>

      <div className="divider" />

      <div className="row">
        <span>Order</span>
        <span>
          #{order.order_id || order.id}
        </span>
      </div>

      <div className="row">
        <span>Room</span>
        <span>{order.room_number || order.room_no || "--"}</span>
      </div>

      <div className="row">
        <span>Hotel</span>
        <span>{order.hotel_name || "VALO"}</span>
      </div>

      <div className="row">
        <span>Date</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>

      <div className="row">
        <span>Time</span>
        <span>{new Date().toLocaleTimeString()}</span>
      </div>

      <div className="divider" />

      <table>
        <tbody>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="qty">
                  {item.quantity || 1}x
                </td>

                <td className="item">
                  <span>{item.name}</span>

                  {item.customization?.instructions && (
                    <div className="note">
                      Note: {item.customization.instructions}
                    </div>
                  )}
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="divider" />

      <div className="row">
        <span>Total Items</span>
        <span>{totalQty}</span>
      </div>

      <div className="row">
        <span>Grand Total</span>
        <span>₹{order.grand_total ?? order.total ?? 0}</span>
      </div>

      <div className="divider" />

      <div className="center">
        <span>Thank You</span>
      </div>

      <div
        className="center"
        style={{
          fontSize: 9,
          marginTop: 4
        }}
      >
        Printed via Valo Ecosystem
      </div>
    </div>
  );
});

PrintableReceipt.displayName = "PrintableReceipt";

export default PrintableReceipt;

import { Link } from 'react-router-dom';
import { getCartItemUnitPrice, useCart } from '../../../context/CartContext';
import { useTheme } from '../../../context/ThemeContext';

const FREE_SHIPPING_THRESHOLD = 100;
const STANDARD_SHIPPING = 25;

const formatMoney = (amount: number) => `$${amount.toFixed(2)}`;

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { darkMode } = useTheme();

  const shipping = subtotal === 0 ? 0 : subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg p-10 text-center`}
          >
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-3`}>
              Your cart is empty
            </h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8`}>
              Add products to your cart and return here to review your order summary.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center bg-primary hover:bg-accent text-white px-6 py-3 rounded-full font-semibold transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-8`}>
          Cart
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section
            className={`xl:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg overflow-hidden`}
          >
            <div
              className={`hidden md:grid grid-cols-[72px_140px_1fr_120px_140px_130px_88px] px-4 py-4 text-sm font-semibold ${darkMode ? 'bg-gray-900 text-light border-b border-gray-700' : 'bg-gray-50 text-gray-700 border-b border-gray-200'}`}
            >
              <div>S. No.</div>
              <div>Product Image</div>
              <div>Product Name</div>
              <div>Unit Price</div>
              <div>Quantity</div>
              <div>Total</div>
              <div>Remove</div>
            </div>

            <div>
              {items.map((item, index) => {
                const unitPrice = getCartItemUnitPrice(item);
                const lineTotal = unitPrice * item.quantity;

                return (
                  <article
                    key={item.productId}
                    className={`grid grid-cols-1 md:grid-cols-[72px_140px_1fr_120px_140px_130px_88px] gap-3 md:gap-0 px-4 py-4 md:items-center ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}
                  >
                    <div className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold md:text-center`}>
                      <span className="md:hidden text-xs uppercase tracking-wide text-gray-500 mr-2">S. No.</span>
                      {index + 1}
                    </div>

                    <div className="flex justify-start md:justify-center">
                      <img
                        src={`/${item.imgName}`}
                        alt={item.name}
                        className="w-20 h-20 object-contain rounded-md"
                      />
                    </div>

                    <div className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold`}>
                      <span className="md:hidden text-xs uppercase tracking-wide text-gray-500 mr-2">Product</span>
                      {item.name}
                    </div>

                    <div className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold md:text-center`}>
                      <span className="md:hidden text-xs uppercase tracking-wide text-gray-500 mr-2">Unit Price</span>
                      {formatMoney(unitPrice)}
                    </div>

                    <div className="flex items-center gap-2 md:justify-center">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className={`w-9 h-9 rounded-lg border ${darkMode ? 'border-gray-600 text-light hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        -
                      </button>
                      <span
                        className={`w-10 h-9 rounded-lg border flex items-center justify-center font-semibold ${darkMode ? 'border-gray-600 text-light bg-gray-900' : 'border-gray-300 text-gray-700 bg-gray-50'}`}
                        aria-label={`Quantity for ${item.name}`}
                      >
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className={`w-9 h-9 rounded-lg border ${darkMode ? 'border-gray-600 text-light hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'} transition-colors`}
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <div className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold md:text-center`}>
                      <span className="md:hidden text-xs uppercase tracking-wide text-gray-500 mr-2">Total</span>
                      {formatMoney(lineTotal)}
                    </div>

                    <div className="md:text-center">
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="p-2 text-primary hover:text-accent transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2h.293l.853 10.242A2 2 0 007.14 18h5.72a2 2 0 001.994-1.758L15.707 6H16a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm-1 4a1 1 0 012 0v8a1 1 0 11-2 0V6zm4-1a1 1 0 00-1 1v8a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div
              className={`px-4 py-4 flex justify-end ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
            >
              <button
                onClick={clearCart}
                className="bg-primary hover:bg-accent text-white px-6 py-2 rounded-full font-semibold transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </section>

          <aside
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-xl border shadow-lg overflow-hidden h-fit`}
          >
            <h2
              className={`px-6 py-5 text-3xl font-bold text-center ${darkMode ? 'text-light bg-gray-900 border-b border-gray-700' : 'text-gray-800 bg-gray-50 border-b border-gray-200'}`}
            >
              Order Summary
            </h2>

            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`${darkMode ? 'text-light' : 'text-gray-700'} font-semibold`}>
                  Subtotal
                </span>
                <span className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold`}>
                  {formatMoney(subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className={`${darkMode ? 'text-light' : 'text-gray-700'} font-semibold`}>
                  Shipping
                </span>
                <span className={`${darkMode ? 'text-light' : 'text-gray-800'} font-semibold`}>
                  {shipping === 0 ? 'Free' : formatMoney(shipping)}
                </span>
              </div>

              <div className={`${darkMode ? 'text-primary' : 'text-green-700'} text-sm`}>
                {subtotal > FREE_SHIPPING_THRESHOLD
                  ? `Free shipping unlocked for orders over ${formatMoney(FREE_SHIPPING_THRESHOLD)}.`
                  : `Add ${formatMoney(Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal))} more for free shipping.`}
              </div>

              <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <span className={`${darkMode ? 'text-light' : 'text-gray-700'} text-xl font-bold`}>
                    Grand Total
                  </span>
                  <span className="text-primary text-2xl font-bold">{formatMoney(total)}</span>
                </div>
              </div>
            </div>

            <div className={`p-5 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <button className="w-full bg-primary hover:bg-accent text-white py-3 rounded-full font-semibold transition-colors">
                Proceed To Checkout
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

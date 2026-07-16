import { Link } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import { useCart } from '../../../context/useCart';
import { getDiscountedPrice } from '../../../context/cartTypes';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export default function CartPage() {
  const { darkMode } = useTheme();
  const { items, subtotal, shipping, total, updateQuantity, removeItem, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div
        className={`min-h-screen ${darkMode ? 'bg-dark' : 'bg-gray-100'} pt-24 pb-16 px-4 transition-colors duration-300`}
      >
        <div className="max-w-3xl mx-auto">
          <div
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-8 border shadow-lg text-center transition-colors duration-300`}
          >
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-3`}>
              Your cart is empty
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Add products to your cart to see them here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-primary hover:bg-accent text-white px-6 py-3 rounded-full font-semibold transition-colors"
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
        <h1
          className={`text-3xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-6 transition-colors duration-300`}
        >
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 items-start">
          <section
            className={`${darkMode ? 'bg-gray-900/70 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg overflow-hidden transition-colors duration-300`}
          >
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`${darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'}`}>
                  <tr>
                    <th className="px-4 py-3 font-semibold text-sm">S. No.</th>
                    <th className="px-4 py-3 font-semibold text-sm">Product</th>
                    <th className="px-4 py-3 font-semibold text-sm">Unit Price</th>
                    <th className="px-4 py-3 font-semibold text-sm">Quantity</th>
                    <th className="px-4 py-3 font-semibold text-sm">Total</th>
                    <th className="px-4 py-3 font-semibold text-sm">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const lineTotal = getDiscountedPrice(item.price, item.discount) * item.quantity;

                    return (
                      <tr
                        key={item.productId}
                        className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td className={`px-4 py-4 text-lg font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={`/${item.imgName}`}
                              alt={item.name}
                              className="w-16 h-16 object-contain rounded-lg bg-black/5 p-1"
                            />
                            <div>
                              <p
                                className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'} transition-colors duration-300`}
                              >
                                {item.name}
                              </p>
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                          {formatCurrency(getDiscountedPrice(item.price, item.discount))}
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className={`inline-flex items-center gap-2 rounded-xl p-1.5 ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}
                          >
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              className={`w-8 h-8 rounded-lg ${darkMode ? 'text-light hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'} transition-colors`}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              -
                            </button>
                            <span
                              className={`min-w-8 text-center font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className={`w-8 h-8 rounded-lg ${darkMode ? 'text-light hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-200'} transition-colors`}
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className={`px-4 py-4 text-lg font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                          {formatCurrency(lineTotal)}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-primary hover:text-accent transition-colors"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"></path>
                              <path d="M10 11v6"></path>
                              <path d="M14 11v6"></path>
                              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"></path>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-4 space-y-4">
              {items.map((item) => {
                const lineTotal = getDiscountedPrice(item.price, item.discount) * item.quantity;

                return (
                  <article
                    key={item.productId}
                    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-xl border p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={`/${item.imgName}`}
                        alt={item.name}
                        className="w-16 h-16 object-contain rounded-lg bg-black/5 p-1"
                      />
                      <div className="flex-grow">
                        <h2 className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                          {item.name}
                        </h2>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                          {formatCurrency(getDiscountedPrice(item.price, item.discount))} each
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="text-primary hover:text-accent transition-colors"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div
                        className={`inline-flex items-center gap-2 rounded-xl p-1.5 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
                      >
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className={`w-8 h-8 rounded-lg ${darkMode ? 'text-light hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'} transition-colors`}
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          -
                        </button>
                        <span
                          className={`min-w-8 text-center font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}
                        >
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className={`w-8 h-8 rounded-lg ${darkMode ? 'text-light hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-300'} transition-colors`}
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          +
                        </button>
                      </div>
                      <p className={`font-bold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                        {formatCurrency(lineTotal)}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div
              className={`flex flex-wrap gap-3 items-center justify-between p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <Link
                to="/products"
                className={`${darkMode ? 'text-light hover:text-primary' : 'text-gray-700 hover:text-primary'} transition-colors`}
              >
                Continue shopping
              </Link>
              <button
                onClick={clearCart}
                className="bg-primary hover:bg-accent text-white rounded-full px-5 py-2 font-semibold transition-colors"
              >
                Clear cart
              </button>
            </div>
          </section>

          <aside
            className={`${darkMode ? 'bg-gray-900/70 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl border shadow-lg p-5 transition-colors duration-300 xl:sticky xl:top-24`}
          >
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-light' : 'text-gray-800'} mb-4`}>
              Order Summary
            </h2>
            <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <div className="flex justify-between py-3">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Subtotal</span>
                <span className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Shipping</span>
                <span className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                  {shipping === 0 ? 'Free' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between py-3 text-lg">
                <span className={`font-semibold ${darkMode ? 'text-light' : 'text-gray-800'}`}>
                  Grand Total
                </span>
                <span className="font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mt-3 mb-5`}>
              Shipping is free for orders over $100. Otherwise a $25 shipping fee applies.
            </p>
            <button className="w-full bg-primary hover:bg-accent text-white rounded-full px-5 py-3 font-semibold transition-colors">
              Proceed to Checkout
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

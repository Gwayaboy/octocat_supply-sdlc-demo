export interface CartProduct {
  productId: number;
  name: string;
  description: string;
  price: number;
  imgName: string;
  discount?: number;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

export const getDiscountedPrice = (price: number, discount?: number): number => {
  if (!discount || discount <= 0) {
    return price;
  }

  return price * (1 - discount);
};

import { getProduct } from './app/product';

interface Request {
    Id: number
}

export async function handler(request: Request) {
    console.debug('Id', request);

    const product = await getProduct(request.Id);
    console.debug('product', JSON.stringify(product));
    return product;    
}
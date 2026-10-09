// Local stand-in for the Shopify Storefront API, for dev and e2e without a store.
// Run: node scripts/mock-storefront.mjs   then set PUBLIC_SHOPIFY_STOREFRONT_URL=http://localhost:4400
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

const money = (amount) => ({ amount, currencyCode: 'GBP' });
// Pictures are served by this mock itself (scripts/mock-images), so no store or CDN is needed.
const image = (name, alt) => ({ url: `${process.env.MOCK_IMAGE_BASE ?? 'http://localhost:4400/images'}/${name}.svg`, altText: alt, width: 800, height: 800 });
const variant = (id, title, amount, availableForSale = true) => ({ id: `gid://shopify/ProductVariant/${id}`, title, availableForSale, price: money(amount) });
const products = [
  {
    id: 'gid://shopify/Product/1', handle: 'house-blend', title: 'Éire House Blend', options: [{ name: 'Grind' }], description: 'Our house blend: smooth, chocolatey and made for the morning. 250g.',
    featuredImage: image('house-blend', 'A bag of Éire house blend coffee'), images: { nodes: [image('house-blend', 'A bag of Éire house blend coffee')] },
    variants: { nodes: [variant(11, 'Whole bean', '9.5'), variant(12, 'Espresso', '9.5'), variant(13, 'Filter', '9.5', false)] },
  },
  {
    id: 'gid://shopify/Product/2', handle: 'mug', title: 'Lighthouse Mug', options: [{ name: 'Title' }], description: 'A sturdy mug in forest green with the shamrock mark.',
    featuredImage: image('mug', 'A forest green mug'), images: { nodes: [image('mug', 'A forest green mug')] },
    variants: { nodes: [variant(21, 'Default Title', '14.0')] },
  },
  {
    id: 'gid://shopify/Product/3', handle: 'tote', title: 'Éire Tote', options: [{ name: 'Title' }], description: 'A cotton tote, big enough for a week of beans.',
    featuredImage: image('tote', 'A cotton tote bag'), images: { nodes: [image('tote', 'A cotton tote bag')] },
    variants: { nodes: [variant(31, 'Default Title', '12.0')] },
  },
];
const variants = new Map(products.flatMap((p) => p.variants.nodes.map((v) => [v.id, { variant: v, product: p }])));
const carts = new Map();

function view(cart) {
  const lines = [...cart.lines.entries()].map(([merchandiseId, quantity]) => {
    const { variant: v, product } = variants.get(merchandiseId);
    return { id: `line:${merchandiseId}`, quantity, merchandise: { id: v.id, title: v.title, product: { title: product.title, handle: product.handle } } };
  });
  const total = [...cart.lines.entries()].reduce((sum, [id, q]) => sum + Number(variants.get(id).variant.price.amount) * q, 0);
  return {
    id: cart.id, checkoutUrl: 'https://example.myshopify.com/checkout/mock', totalQuantity: lines.reduce((s, l) => s + l.quantity, 0),
    cost: { totalAmount: money(total.toFixed(1)) }, lines: { nodes: lines },
  };
}

function handle({ query, variables }) {
  if (query.includes('query Products')) return { products: { nodes: products } };
  if (query.includes('query Cart')) return { cart: carts.has(variables.id) ? view(carts.get(variables.id)) : null };
  if (query.includes('cartCreate')) {
    const cart = { id: `gid://shopify/Cart/${carts.size + 1}`, lines: new Map() };
    carts.set(cart.id, cart);
    for (const l of variables.lines) cart.lines.set(l.merchandiseId, l.quantity);
    return { cartCreate: { cart: view(cart) } };
  }
  const cart = carts.get(variables.cartId);
  if (!cart) return { cart: null };
  if (query.includes('cartLinesAdd')) {
    for (const l of variables.lines) cart.lines.set(l.merchandiseId, (cart.lines.get(l.merchandiseId) ?? 0) + l.quantity);
    return { cartLinesAdd: { cart: view(cart) } };
  }
  if (query.includes('cartLinesUpdate')) {
    for (const l of variables.lines) cart.lines.set(l.id.replace('line:', ''), l.quantity);
    return { cartLinesUpdate: { cart: view(cart) } };
  }
  if (query.includes('cartLinesRemove')) {
    for (const id of variables.lineIds) cart.lines.delete(id.replace('line:', ''));
    return { cartLinesRemove: { cart: view(cart) } };
  }
  throw new Error('Unhandled operation');
}

createServer((request, response) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' };
  if (request.method === 'OPTIONS') return response.writeHead(204, headers).end();
  const asset = /^\/images\/([a-z-]+)\.svg$/.exec(request.url ?? '');
  if (request.method === 'GET' && asset) {
    try {
      return response.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Access-Control-Allow-Origin': '*' }).end(readFileSync(new URL(`./mock-images/${asset[1]}.svg`, import.meta.url)));
    } catch {
      return response.writeHead(404).end();
    }
  }
  let body = '';
  request.on('data', (chunk) => (body += chunk));
  request.on('end', () => {
    let payload;
    try {
      payload = { data: handle(JSON.parse(body)) };
    } catch (error) {
      payload = { errors: [{ message: String(error) }] };
    }
    response.writeHead(200, headers).end(JSON.stringify(payload));
  });
}).listen(4400, () => console.log('Mock Storefront API on http://localhost:4400'));

import { reactive } from 'vue'
export const cart = reactive({
  items: [],   // {id,title,price,imageUrl,sellerId,sellerName,sellerPhone}
  add(item){ if(!this.items.find(i => i.id === item.id)) this.items.push(item) },
  remove(id){ this.items = this.items.filter(i => i.id !== id) },
  clear(){ this.items = [] },
  total(){ return this.items.reduce((a,b)=> a + Number(b.price||0), 0) }
})
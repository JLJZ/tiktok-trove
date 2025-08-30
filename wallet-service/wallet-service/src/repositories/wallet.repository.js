/**
 * Repository contract (documentation)
 * - getWallet(userId): Promise<{coins:number, diamonds:number}>
 * - purchaseCoins(userId, packageId): Promise<{newBalance:number, transactionId:string}>
 * - convertDiamonds(userId, amount): Promise<{payoutId:string, amount:number, status:string}>
 * - listTransactions(userId): Promise<Array<{id:string,type:string,amount:number,timestamp:string}>>
 */

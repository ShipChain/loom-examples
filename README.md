# Loom Examples

This repository holds a few example projects.

##  Universal Signing Demos

The simple universal signing demos show how Loom universal signing works.

### Install

```bash
npm install
```

### Deploy to Extdev

First, let's generate your Loom private key by running:

```bash
npm run gen:loom-key
```

Then, we can migrate the the `SimpleStore` smart contract:

```bash
npm run migrate:loom
```

### Start the web server

```bash
npm run start
```

Open [http://localhost:8080/](http://localhost:8080/) in your favorite browser.

### Transaction Hash Discrepancy

At 3 different times during the process of sending a raw (signed) transaction, I see different
transaction hashes. I expect to see a single hash.  With the current hash discrepancy, there is not
a clean way to query for the results of a transaction by the pre-computed transaction hash as you
would normally for an ethereum transaction.

Also, even if you capture the transaction hash from the TransactionReceipt returned by Loom, that
hash is different from the hash that is emitted as part of the contract events.

#### Test account

address: `0x41ef0087901189bB5134De780fC6b3392C7914E6`

privateKey: `0x0110000101110100011001010111001101110100011010110110010101111001`

Import this private key in to your metamask.  Run the example with the commands above, and when
utilizing the EthSigning example served in your local browser to increment the counter, you will be
using the JSON RPC endpoint at: wss://extdev-plasma-us1.dappchains.com/eth with standard web3js.

Updated code can be found in the added [_setValueRawTransaction()](https://github.com/ShipChain/loom-examples/blob/master/src/EthSigning/EthSigning.js#L171)
method of EthSigning.js

### 3 different transaction hashes


#### ethereumjs-tx hash

This is calculated when signing the transaction with a privateKey, prior to sending to `wss://extdev-plasma-us1.dappchains.com/eth`, using the standard ethereumjs-tx methods to sign a generated transaction. `0x3f72d201279d1d83b84fcbd4adc5ac4b0c929f57104d837f1a800f5da9d63f75`

No transaction by this hash is found in the exposed `/rpc` endpoint. [https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x3f72d201279d1d83b84fcbd4adc5ac4b0c929f57104d837f1a800f5da9d63f75](https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x3f72d201279d1d83b84fcbd4adc5ac4b0c929f57104d837f1a800f5da9d63f75)

This transaction hash is not indexed in the block explorer.

Contract Events are not associated to this hash.

#### getTransactionReceipt hash

This is the hash returned in the receipt from Loom after we call `web3.eth.sendSignedTransaction`: `0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52`

A transaction is found in the exposed `/rpc` endpoint and it appears to be the `call.evm` transaction.  [https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52](https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52)

This transaction hash is not indexed in the block explorer.

Contract Events are not associated to this hash.

#### getTransaction hash

This hash is found in the "Transaction" object returned from querying for the transaction hash found in the receipt `web3.eth.getTransaction(0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52)`: `0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404`

No transaction by this hash is found in the exposed `/rpc` endpoint. [https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404](https://extdev-plasma-us1.dappchains.com/rpc/tx?hash=0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404)

This transaction hash is indexed in the block explorer: [https://extdev-blockexplorer.dappchains.com/tx/0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404](https://extdev-blockexplorer.dappchains.com/tx/0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404)

Emitted Contract Events _are_ associated to this hash.

#### Debug Output


```
callerAddress: eth:0x41ef0087901189bb5134de780fc6b3392c7914e6
mapping already exists
mapping.ethereum: eth:0x41ef0087901189bb5134de780fc6b3392c7914e6
mapping.loom: extdev-plasma-us1:0x4969f8a34c1eacdd792641423470fa38826c4925
Setting value: 1

unsignedTx: {
  "nonce": 46,
  "gasPrice": 0,
  "gasLimit": 0,
  "to": "0xf03FFb4fbEBB58AE936741C0B4D756e9412Cab9B",
  "value": 0,
  "data": "0x60fe47b10000000000000000000000000000000000000000000000000000000000000001"
}

Signed Tx: {
  "nonce": "0x2e",
  "gasPrice": "0x",
  "gasLimit": "0x",
  "to": "0xf03ffb4fbebb58ae936741c0b4d756e9412cab9b",
  "value": "0x",
  "data": "0x60fe47b10000000000000000000000000000000000000000000000000000000000000001",
  "v": "0x1b",
  "r": "0x1efdd0467fff2dc590cdab5f6a9415e7000f809e0c86c968e8b3c34eb067f9e2",
  "s": "0x7e863b37937eb9a62772da20e8d4e8d1b13fa8db0d59bde7f214ebb9f7d4d217"
}

rawSignedTx: "0xf8812e808094f03ffb4fbebb58ae936741c0b4d756e9412cab9b80a460fe47b100000000000000000000000000000000000000000000000000000000000000011ba01efdd0467fff2dc590cdab5f6a9415e7000f809e0c86c968e8b3c34eb067f9e2a07e863b37937eb9a62772da20e8d4e8d1b13fa8db0d59bde7f214ebb9f7d4d217"

Transaction Receipt: {
  "transactionHash": "0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52",
  "transactionIndex": 0,
  "blockHash": "0xa6cc5fc800760dbcf0e94a613bf00c3ec3b5e6d474f4f1ec504996ee39cc2f0d",
  "blockNumber": 10306567,
  "from": "0x4969f8a34c1eacdd792641423470fa38826c4925",
  "cumulativeGasUsed": 0,
  "gasUsed": 0,
  "contractAddress": null,
  "to": "0xf03ffb4fbebb58ae936741c0b4d756e9412cab9b",
  "logs": [
    {
      "logIndex": 0,
      "transactionIndex": 0,
      "transactionHash": "0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52",
      "blockHash": "0xa6cc5fc800760dbcf0e94a613bf00c3ec3b5e6d474f4f1ec504996ee39cc2f0d",
      "blockNumber": 10306567,
      "address": "0xf03FFb4fbEBB58AE936741C0B4D756e9412Cab9B",
      "data": "0x0000000000000000000000000000000000000000000000000000000000000001",
      "topics": [
        "0xb922f092a64f1a076de6f21e4d7c6400b6e55791cc935e7bb8e7e90f7652f15b"
      ],
      "blockTime": "0x5e33376f",
      "id": "log_fec12164"
    }
  ],
  "logsBloom": "0x002080808a88041005",
  "status": true
}

Transaction by 0x1ae4e511202fa8ceb502df825778ada19f7a04c00a351392222ea317e90dde52: {
  "hash": "0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404",
  "nonce": 47,
  "blockHash": "0xa6cc5fc800760dbcf0e94a613bf00c3ec3b5e6d474f4f1ec504996ee39cc2f0d",
  "blockNumber": 10306567,
  "transactionIndex": 0,
  "from": "0x41ef0087901189bB5134De780fC6b3392C7914E6",
  "to": "0xf03FFb4fbEBB58AE936741C0B4D756e9412Cab9B",
  "value": "0",
  "gasPrice": "0",
  "gas": 0,
  "input": "0x60fe47b10000000000000000000000000000000000000000000000000000000000000001"
}

Transaction by 0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404: {
  "hash": "0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404",
  "nonce": 47,
  "blockHash": "0xa6cc5fc800760dbcf0e94a613bf00c3ec3b5e6d474f4f1ec504996ee39cc2f0d",
  "blockNumber": 10306567,
  "transactionIndex": 0,
  "from": "0x41ef0087901189bB5134De780fC6b3392C7914E6",
  "to": "0xf03FFb4fbEBB58AE936741C0B4D756e9412Cab9B",
  "value": "0",
  "gasPrice": "0",
  "gas": 0,
  "input": "0x60fe47b10000000000000000000000000000000000000000000000000000000000000001"
}

Events for Transaction: [
  {
    "logIndex": 0,
    "transactionIndex": 0,
    "transactionHash": "0x2aff25fbe08cdb6012489a3954e4eee7ee331a8d47f24be6a6a34a105920e404",
    "blockHash": "0xa6cc5fc800760dbcf0e94a613bf00c3ec3b5e6d474f4f1ec504996ee39cc2f0d",
    "blockNumber": 10306567,
    "address": "0xf03FFb4fbEBB58AE936741C0B4D756e9412Cab9B",
    "data": "0x0000000000000000000000000000000000000000000000000000000000000001",
    "topics": [
      "0xb922f092a64f1a076de6f21e4d7c6400b6e55791cc935e7bb8e7e90f7652f15b"
    ],
    "blockTime": "0x5e33376f",
    "id": "log_cd58e663"
  }
]
```

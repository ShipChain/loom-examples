import {
  NonceTxMiddleware,
  SignedEthTxMiddleware,
  CryptoUtils,
  Client,
  LoomProvider,
  Address,
  LocalAddress,
  EthersSigner,
  createDefaultTxMiddleware,
  getMetamaskSigner
} from 'loom-js'

import { AddressMapper } from 'loom-js/dist/contracts'
import { EventBus } from '../EventBus/EventBus'
import networkConfigs from '../../network-configs.json'
import SimpleStoreJSON from '../../loom/build/contracts/SimpleStore.json'

const Web3 = require('web3')
const EthereumTx = require('ethereumjs-tx')

export default class EthSigning {
  async load (web3js) {
    this.counter = 0
    this.extdevConfig = networkConfigs.networks['extdev']
    const client = this._createClient()
    client.on('error', console.error)
    const ethProvider = web3js.currentProvider
    ethProvider.isMetaMask = true
    const callerAddress = await this._setupSigner(client, ethProvider)
    console.log('callerAddress: ' + callerAddress)
    const loomProvider = await this._createLoomProvider(client, callerAddress)
    let accountMapping = await this._loadMapping(callerAddress, client)
    if (accountMapping === null) {
      console.log('Create a new mapping')
      const signer = getMetamaskSigner(ethProvider)
      await this._createNewMapping(signer)
      accountMapping = await this._loadMapping(callerAddress, client)
      console.log(accountMapping)
    } else {
      console.log('mapping already exists')
    }
    console.log('mapping.ethereum: ' + accountMapping.ethereum.toString())
    console.log('mapping.loom: ' + accountMapping.loom.toString())
    this.accountMapping = accountMapping
    this.web3js = web3js
    this.web3loom = new Web3(loomProvider)
    this.web3js2loom = new Web3('wss://extdev-plasma-us1.dappchains.com/eth')
    await this._getContract()
    await this._filterEvents()
    await this._setValue()
  }

  async _loadMapping (ethereumAccount, client) {
    const mapper = await AddressMapper.createAsync(client, ethereumAccount)
    let accountMapping = { ethereum: null, loom: null }
    try {
      const mapping = await mapper.getMappingAsync(ethereumAccount)
      accountMapping = {
        ethereum: mapping.from,
        loom: mapping.to
      }
    } catch (error) {
      console.error(error)
      accountMapping = null
    } finally {
      mapper.removeAllListeners()
    }
    return accountMapping
  }

  async _createLoomProvider (client, callerAddress) {
    const dummyKey = CryptoUtils.generatePrivateKey()
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(dummyKey)
    const dummyAccount = LocalAddress.fromPublicKey(publicKey).toString()
    const loomProvider = new LoomProvider(
      client,
      dummyKey,
      () => client.txMiddleware
    )
    loomProvider.setMiddlewaresForAddress(callerAddress.local.toString(), client.txMiddleware)
    loomProvider.callerChainId = callerAddress.chainId
    // remove dummy account
    loomProvider.accounts.delete(dummyAccount)
    loomProvider._accountMiddlewares.delete(dummyAccount)
    return loomProvider
  }

  async _setupSigner (loomClient, provider) {
    const signer = getMetamaskSigner(provider)
    const ethAddress = await signer.getAddress()
    const callerAddress = new Address('eth', LocalAddress.fromHexString(ethAddress))

    loomClient.txMiddleware = [
      new NonceTxMiddleware(callerAddress, loomClient),
      new SignedEthTxMiddleware(signer)
    ]

    return callerAddress
  }

  _createClient () {
    const chainId = this.extdevConfig['chainId']
    const writeUrl = this.extdevConfig['writeUrl']
    const readUrl = this.extdevConfig['readUrl']
    const client = new Client(chainId, writeUrl, readUrl)
    return client
  }

  async _createNewMapping (signer) {
    const ethereumAccount = await signer.getAddress()
    const ethereumAddress = Address.fromString(`eth:${ethereumAccount}`)
    const loomEthSigner = new EthersSigner(signer)
    const privateKey = CryptoUtils.generatePrivateKey()
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey)
    const client = this._createClient()
    client.txMiddleware = createDefaultTxMiddleware(client, privateKey)
    const loomAddress = new Address(client.chainId, LocalAddress.fromPublicKey(publicKey))

    const mapper = await AddressMapper.createAsync(client, loomAddress)
    try {
      await mapper.addIdentityMappingAsync(
        ethereumAddress,
        loomAddress,
        loomEthSigner
      )
      client.disconnect()
    } catch (e) {
      if (e.message.includes('identity mapping already exists')) {
      } else {
        console.error(e)
      }
      client.disconnect()
      return false
    }
  }

  async _getContract () {
    this.contract = new this.web3loom.eth.Contract(SimpleStoreJSON.abi, SimpleStoreJSON.networks[this.extdevConfig['networkId']].address)
  }

  async _generateTransaction(value) {
    const abiEncodedData = this.contract.methods.set(value).encodeABI()
    return {
      nonce: await this.web3js2loom.eth.getTransactionCount('0x41ef0087901189bB5134De780fC6b3392C7914E6'),
      gasPrice: 0,
      gasLimit: 0,
      to: this.contract.options.address,
      value: 0,
      data: abiEncodedData,
    }
  }

  _signTransaction(unsignedTx) {
    const privateKey = new Buffer('0110000101110100011001010111001101110100011010110110010101111001', 'hex')
    const tx = new EthereumTx(unsignedTx)

    tx.sign(privateKey)

    console.debug(`Signed Tx: ${JSON.stringify(tx.toJSON(true), null, 2)}`)

    const txHash = '0x' + tx.hash().toString('hex')
    const txSigned = '0x' + tx.serialize().toString('hex')
    return [txSigned, txHash]
  }

  async _sendTransaction(tx) {
    return await this.web3js2loom.eth.sendSignedTransaction(tx)
  }

  async _setValueRawTransaction () {
    const value = parseInt(this.counter, 10)
    console.debug(`Setting value: ${value}`)
    
    const unsignedTx = await this._generateTransaction(value)
    console.debug(`unsignedTx: ${JSON.stringify(unsignedTx, null, 2)}`)
    
    const [signedTx, txHash] = this._signTransaction(unsignedTx)
    console.debug(`rawSignedTx: ${signedTx}`)    
    
    const receipt = await this._sendTransaction(signedTx)
    console.debug(`Transaction Receipt: ${JSON.stringify(receipt, null, 2)}`)

    const transactionObj = await this.web3js2loom.eth.getTransaction(receipt.transactionHash)
    console.debug(`Transaction by ${receipt.transactionHash}: ${JSON.stringify(transactionObj, null, 2)}`)
    
    const receipt2 = await this.web3js2loom.eth.getTransaction(transactionObj.hash)
    console.debug(`Transaction by ${transactionObj.hash}: ${JSON.stringify(receipt2, null, 2)}`)
    
    console.log(`TransactionHash from ethereumjs-tx: ${txHash}`)
    console.log(`TransactionHash from Loom Receipt : ${receipt.transactionHash}`)
    console.log(`TransactionHash from Transaction  : ${transactionObj.hash}`)

    const events = await this.web3js2loom.eth.getPastLogs({
      fromBlock: receipt.blockNumber, 
      toBlock: receipt.blockNumber,
      address: this.contract.options.address
    })

    console.debug(`Events for Transaction: ${JSON.stringify(events, null, 2)}`)
    console.log(`TransactionHash from Event        : ${events[0].transactionHash}`)
  }

  async _setValue () {
    const ethAddress = this.accountMapping.ethereum.local.toString()
    const value = parseInt(this.counter, 10)
    await this.contract.methods
      .set(value)
      .send({
        from: ethAddress
      })
  }

  async increment () {
    this.info = 'Please sign the transaction.'
    this.counter += 1
    await this._setValueRawTransaction()
  }

  async decrement () {
    this.info = 'Please sign the transaction.'
    if (this.counter > 0) {
      this.counter -= 1
      await this._setValueRawTransaction()
    } else {
      console.log('counter should be > 1.')
    }
  }

  async _filterEvents () {
    const loomAddress = this.accountMapping.loom.local.toString()
    this.contract.events.NewValueSet({ filter: { address: loomAddress } }, (err, event) => {
      if (err) {
        console.error('Error on event', err)
      } else {
        if (event.returnValues._value.toString() === this.counter.toString()) {
          const info = 'Looking good! Expected: ' + this.counter.toString() + ', Returned: ' + event.returnValues._value.toString()
          EventBus.$emit('updateValue', { info: info, counter: this.counter })
        } else {
          const info = 'An error occured! Expected: ' + this.counter.toString() + ', Returned: ' + event.returnValues._value.toString()
          EventBus.$emit('updateValue', { info: info, counter: this.counter })
        }
      }
    })
  }
}


const { CreateTransactionRequest } = require('fuels');
const qs = require('qs');

let currentTrade = {};
let currentSelectSide;
let tokens;

async function init(){
  await listAvailableTokens();
}

async function listAvailableTokens(){
  console.log("initializing");
  let response = await fetch('https://tokens.coingecko.com/uniswap/all.json');
  let tokenListJSON = await response.json();
  console.log("listing available tokens");
  console.log(tokenListJSON);
  tokens = tokenListJSON.tokens
  console.log("tokens:", tokens);

  // token list
  let parent = document.getElementById("token_list");
  for (const i in tokens){
    let div = document.createElement("div");
    div.className = "token_row";
    let html = `
    <img class="token_list_img" src="${tokens[i].logoURI}">
      <span class="token_list_text">${tokens[i].symbol}</span>
      `;
    div.innerHTML = html;
    div.onclick = () => {
      selectToken(tokens[i]);
    };
    parent.appendChild(div);
  }
}

function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log("currentTrade:" , currentTrade);
  renderInterface();
}

function renderInterface(){
  if (currentTrade.from) {
    console.log(currentTrade.from)
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }

}

async function connect() {
    if (typeof window.ethereum !== "undefined") {
        try {
          console.log("connecting");
          await ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
          console.log(error);
        }
        document.getElementById("login_button").innerHTML = "Connected";
        document.getElementById("swap_button").disabled = false;
      } else {
        document.getElementById("login_button").innerHTML =
          "Please install MetaMask";
      }
    }

function openModal(side){
    currentSelectSide = side;
    document.getElementById("token_modal").style.display = "block";
}

function closeModal(){
  document.getElementById("token_modal").style.display = "none";
}

async function getPrice(){
  console.log("Getting Price");
  

  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) {
    return;
  }
  
  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
  }

  // swap prices
  const response = await fetch(
    `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );
  
  swapPriceJSON = await response.json();
  console.log("Price: ", swapPriceJSON);
  
  //not yet working 
  if (isNaN(swapPriceJSON.buyAmount)) {
    document.getElementById("to_amount").innerHTML = "Not Enough Liquidity";
  }
  
  document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(account) {
  console.log("Getting quote");
  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) {
    return;
  }

  let amount = Number(get.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);
  const params = {
    sellToken : currentTrade.from.address,
    buyToken : currentTrade.to.address,
    sellAmount : amount,
    takerAddress : account,
  }

  const response = await fetch(
    `https://api.0x.org/swap/v1/price?${qs.stringify(params)}`
    );
  
  swapQuoteJSON = await response.json();
  console.log("Price: ", swapQuoteJSON);
  document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;

  return swapQuoteJSON;

}

async function trySwap() {
  let accounts = await ethereum.request({method : "eth_accounts"});
  let takerAddress = accounts[0];
  console.log("Taker Address", takerAddress);
  const swapQuoteJSON = await  getQuote(takerAddress);
  
  const erc20abi = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]
const fromTokenAddress = currentTrade.from.address;
const  web3 = new  Web3(Web3.givenProvider);
const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);
console.log("setup ERC20TokenContract: ", ERC20TokenContract);
const maxApproval = new BigNumber(2).pow(256).minus(1);
console.log("approval amount: ", maxApproval);

const tx = await ERC20TokenContract.methods.approve(swapQuoteJSON.allowanceTarget, maxApproval).send({from : takerAddress}).then(tx => console.log("tx :", tx));

const receipt = web3.eth.sendTransaction(swapQuoteJSON);
console.log("receipt", receipt);

}


init();

document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
};
document.getElementById("to_token_select").onclick = () => {
  openModal("to");
};
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;



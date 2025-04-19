# **Xion Bank Contract**

This is a basic CosmWasm smart contract that allows users to deposit and withdraw the Xion token (uxion).

## Features

- **Deposit**: Users can deposit uxion tokens into the contract
- **Withdraw**: Users can withdraw their entire balance of uxion tokens from the contract
- **Check Balance**: Users can query their current balance

## Building the Contract

To build the contract:

```bash
cargo wasm
```

This will create the wasm binary at `target/wasm32-unknown-unknown/release/cw_counter.wasm`

For optimized builds:

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.6
```

## Running Tests

```bash
cargo test
```

## Usage Example

### Deploy the Contract

```bash
RES=$(xiond tx wasm store ./artifacts/cw_counter.wasm \
  --from wallet \
  --gas-prices 0.1uxion \
  --gas auto \
  --gas-adjustment 1.3 \
  -b block \
  -y \
  --output json)

CODE_ID=$(echo $RES | jq -r '.logs[0].events[-1].attributes[0].value')
echo "Contract Code ID: $CODE_ID"
```

### Instantiate the Contract

```bash
xiond tx wasm instantiate $CODE_ID \
  '{}' \
  --from wallet \
  --label "xion-bank" \
  --gas-prices 0.1uxion \
  --gas auto \
  --gas-adjustment 1.3 \
  -b block \
  -y \
  --no-admin

# Get the contract address
CONTRACT=$(xiond query wasm list-contract-by-code $CODE_ID --output json | jq -r '.contracts[-1]')
echo "Contract Address: $CONTRACT"
```

### Deposit Funds

```bash
# Deposit 5 uxion
xiond tx wasm execute $CONTRACT \
  '{"deposit":{}}' \
  --from wallet \
  --gas-prices 0.1uxion \
  --gas auto \
  --gas-adjustment 1.3 \
  --amount 5uxion \
  -b block \
  -y
```

### Query Balance

```bash
WALLET_ADDR=$(xiond keys show wallet -a)
xiond query wasm contract-state smart $CONTRACT \
  '{"get_balance":{"address":"'$WALLET_ADDR'"}}' \
  --output json
```

### Withdraw Funds

```bash
xiond tx wasm execute $CONTRACT \
  '{"withdraw":{}}' \
  --from wallet \
  --gas-prices 0.1uxion \
  --gas auto \
  --gas-adjustment 1.3 \
  -b block \
  -y
```

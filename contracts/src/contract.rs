#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, BankMsg, Coin};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, BalanceResponse};
use crate::state::BALANCES;

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:xion-bank";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    _msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    
    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("contract_name", CONTRACT_NAME))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::Deposit {} => execute::deposit(deps, info),
        ExecuteMsg::Withdraw {} => execute::withdraw(deps, env, info),
    }
}

pub mod execute {
    use super::*;

    pub fn deposit(deps: DepsMut, info: MessageInfo) -> Result<Response, ContractError> {
        // Check if funds were sent
        if info.funds.is_empty() {
            return Err(ContractError::NoFunds {});
        }

        // Check that only uxion token is sent
        for coin in info.funds.iter() {
            if coin.denom != "uxion" {
                return Err(ContractError::InvalidDenom {
                    denom: coin.denom.clone(),
                });
            }
        }

        // Get current balance or create a new empty one
        let balance = BALANCES.may_load(deps.storage, &info.sender)?
            .unwrap_or_default();
        
        // Add new funds to balance
        let mut updated_balance = balance;
        for coin in info.funds.iter() {
            // Check if we already have this denomination
            if let Some(existing) = updated_balance.iter_mut().find(|c| c.denom == coin.denom) {
                existing.amount += coin.amount;
            } else {
                updated_balance.push(coin.clone());
            }
        }

        // Save updated balance
        BALANCES.save(deps.storage, &info.sender, &updated_balance)?;

        Ok(Response::new()
            .add_attribute("action", "deposit")
            .add_attribute("amount", format!("{:?}", info.funds)))
    }

    pub fn withdraw(deps: DepsMut, _env: Env, info: MessageInfo) -> Result<Response, ContractError> {
        // Get current balance
        let balance = BALANCES.may_load(deps.storage, &info.sender)?
            .unwrap_or_default();

        // Check if there's anything to withdraw
        if balance.is_empty() {
            return Err(ContractError::NoBalance {});
        }

        // Create bank message to send funds back to user
        let bank_msg = BankMsg::Send {
            to_address: info.sender.to_string(),
            amount: balance.clone(),
        };

        // Clear user's balance
        BALANCES.remove(deps.storage, &info.sender);

        Ok(Response::new()
            .add_message(bank_msg)
            .add_attribute("action", "withdraw")
            .add_attribute("amount", format!("{:?}", balance)))
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetBalance { address } => to_json_binary(&query::balance(deps, address)?),
    }
}

pub mod query {
    use super::*;
    use cosmwasm_std::Addr;

    pub fn balance(deps: Deps, address: String) -> StdResult<BalanceResponse> {
        let addr = deps.api.addr_validate(&address)?;
        let balance = BALANCES.may_load(deps.storage, &addr)?.unwrap_or_default();
        Ok(BalanceResponse { balance })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use cosmwasm_std::testing::{mock_dependencies, mock_env, mock_info};
    use cosmwasm_std::{from_binary, coin};

    #[test]
    fn proper_initialization() {
        let mut deps = mock_dependencies();
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &[]);
        
        let res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();
        assert_eq!(0, res.messages.len());
    }

    #[test]
    fn deposit_and_withdraw() {
        let mut deps = mock_dependencies();
        
        // Initialize the contract
        let msg = InstantiateMsg {};
        let info = mock_info("creator", &[]);
        let _res = instantiate(deps.as_mut(), mock_env(), info, msg).unwrap();

        // Try deposit with no funds
        let info = mock_info("user1", &[]);
        let msg = ExecuteMsg::Deposit {};
        let res = execute(deps.as_mut(), mock_env(), info, msg);
        match res {
            Err(ContractError::NoFunds {}) => {}
            _ => panic!("Must return no funds error"),
        }

        // Try deposit with invalid token
        let invalid_funds = vec![coin(100, "atom")];
        let info = mock_info("user1", &invalid_funds);
        let msg = ExecuteMsg::Deposit {};
        let res = execute(deps.as_mut(), mock_env(), info, msg);
        match res {
            Err(ContractError::InvalidDenom { denom }) => {
                assert_eq!("atom", denom);
            }
            _ => panic!("Must return invalid denom error"),
        }

        // Successful deposit
        let deposit_amount = vec![coin(100, "uxion"), coin(50, "uxion")];
        let info = mock_info("user1", &deposit_amount);
        let msg = ExecuteMsg::Deposit {};
        let _res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();

        // Check balance
        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetBalance { address: "user1".to_string() }).unwrap();
        let value: BalanceResponse = from_binary(&res).unwrap();
        
        // Since we're depositing the same token twice, they should be combined
        let expected_balance = vec![coin(150, "uxion")];
        assert_eq!(expected_balance, value.balance);

        // Withdraw the funds
        let info = mock_info("user1", &[]);
        let msg = ExecuteMsg::Withdraw {};
        let res = execute(deps.as_mut(), mock_env(), info, msg).unwrap();
        
        // Verify the message to send funds
        assert_eq!(1, res.messages.len());

        // Balance should be empty after withdrawal
        let res = query(deps.as_ref(), mock_env(), QueryMsg::GetBalance { address: "user1".to_string() }).unwrap();
        let value: BalanceResponse = from_binary(&res).unwrap();
        assert!(value.balance.is_empty());
    }
}

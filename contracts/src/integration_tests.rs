#[cfg(test)]
mod tests {
    use crate::helpers::XionBankContract;
    use crate::msg::{ExecuteMsg, InstantiateMsg, BalanceResponse};
    use cosmwasm_std::{Addr, Coin, Empty, Uint128};
    use cw_multi_test::{App, AppBuilder, Contract, ContractWrapper, Executor};

    pub fn contract_template() -> Box<dyn Contract<Empty>> {
        let contract = ContractWrapper::new(
            crate::contract::execute,
            crate::contract::instantiate,
            crate::contract::query,
        );
        Box::new(contract)
    }

    const USER: &str = "USER";
    const ADMIN: &str = "ADMIN";
    const NATIVE_DENOM: &str = "uxion";

    fn mock_app() -> App {
        AppBuilder::new().build(|router, _, storage| {
            router
                .bank
                .init_balance(
                    storage,
                    &Addr::unchecked(USER),
                    vec![Coin {
                        denom: NATIVE_DENOM.to_string(),
                        amount: Uint128::new(1000),
                    }],
                )
                .unwrap();
        })
    }

    fn proper_instantiate() -> (App, XionBankContract) {
        let mut app = mock_app();
        let contract_id = app.store_code(contract_template());

        let msg = InstantiateMsg {};
        let contract_addr = app
            .instantiate_contract(
                contract_id,
                Addr::unchecked(ADMIN),
                &msg,
                &[],
                "test",
                None,
            )
            .unwrap();

        let contract = XionBankContract(contract_addr);

        (app, contract)
    }

    mod bank {
        use super::*;

        #[test]
        fn deposit_and_withdraw() {
            let (mut app, contract) = proper_instantiate();

            // Check initial balance (should be empty)
            let balance: BalanceResponse = app
                .wrap()
                .query_wasm_smart(
                    contract.addr(),
                    &crate::msg::QueryMsg::GetBalance {
                        address: USER.to_string(),
                    },
                )
                .unwrap();
            assert!(balance.balance.is_empty());

            // Deposit funds
            let deposit_msg = ExecuteMsg::Deposit {};
            let cosmos_msg = contract.call(deposit_msg).unwrap();
            app.execute(
                Addr::unchecked(USER),
                cosmos_msg,
                &[Coin {
                    denom: NATIVE_DENOM.to_string(),
                    amount: Uint128::new(500),
                }],
            )
            .unwrap();

            // Check balance after deposit
            let balance: BalanceResponse = app
                .wrap()
                .query_wasm_smart(
                    contract.addr(),
                    &crate::msg::QueryMsg::GetBalance {
                        address: USER.to_string(),
                    },
                )
                .unwrap();
            assert_eq!(balance.balance.len(), 1);
            assert_eq!(balance.balance[0].denom, NATIVE_DENOM);
            assert_eq!(balance.balance[0].amount, Uint128::new(500));

            // Withdraw funds
            let withdraw_msg = ExecuteMsg::Withdraw {};
            let cosmos_msg = contract.call(withdraw_msg).unwrap();
            
            // Get user balance before withdrawal
            let user_balance_before = app.wrap().query_all_balances(Addr::unchecked(USER)).unwrap();
            assert_eq!(user_balance_before[0].amount, Uint128::new(500));
            
            // Execute withdrawal
            app.execute(Addr::unchecked(USER), cosmos_msg, &[]).unwrap();
            
            // Check contract balance (should be empty)
            let balance: BalanceResponse = app
                .wrap()
                .query_wasm_smart(
                    contract.addr(),
                    &crate::msg::QueryMsg::GetBalance {
                        address: USER.to_string(),
                    },
                )
                .unwrap();
            assert!(balance.balance.is_empty());
            
            // Check user balance after withdrawal
            let user_balance_after = app.wrap().query_all_balances(Addr::unchecked(USER)).unwrap();
            assert_eq!(user_balance_after[0].amount, Uint128::new(1000));
        }
    }
}

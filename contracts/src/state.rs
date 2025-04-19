use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, Coin};
use cw_storage_plus::Map;

pub const BALANCES: Map<&Addr, Vec<Coin>> = Map::new("balances");

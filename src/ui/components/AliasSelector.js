// @flow

import React, {useState, useEffect} from "react";
import {useCombobox} from "downshift";
import {Ledger} from "../../ledger/ledger";
import {type Alias, type IdentityId} from "../../ledger/identity";
import {CredView} from "../../analysis/credView";
import {type NodeAddressT} from "../../core/graph";
import Markdown from "react-markdown";
import removeMd from "remove-markdown";

type Props = {|
  +selectedIdentityId: IdentityId,
  +ledger: Ledger,
  +credView: CredView,
  +setLedger: (Ledger) => void,
|};

export function AliasSelector({
  selectedIdentityId,
  ledger,
  setLedger,
  credView,
}: Props) {
  const selectedAccount = ledger.account(selectedIdentityId);
  if (selectedAccount == null) {
    throw new Error("Selected identity not present in ledger");
  }
  const selectedIdentity = selectedAccount.identity;
  const [inputValue, setInputValue] = useState("");

  const claimedAddresses: Set<NodeAddressT> = new Set();
  for (const {identity} of ledger.accounts()) {
    claimedAddresses.add(identity.address);
    for (const {address} of identity.aliases) {
      claimedAddresses.add(address);
    }
  }

  const potentialAliases = credView
    .userNodes()
    .map(({address, description}) => ({
      address,
      description,
    }))
    .filter(({address}) => !claimedAddresses.has(address));

  function filteredAliasesMatchingString(input: string): Alias[] {
    return potentialAliases.filter(({description}) =>
      removeMd(description).toLowerCase().startsWith(input.toLowerCase())
    );
  }

  const [inputItems, setInputItems] = useState(
    filteredAliasesMatchingString("")
  );

  const setAliasSearch = (input: string = "") => {
    setInputItems(filteredAliasesMatchingString(input));
  };

  useEffect(() => {
    setAliasSearch();
  }, [selectedAccount.identity.aliases]);

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectItem,
  } = useCombobox({
    inputValue,
    items: inputItems,
    onStateChange: ({inputValue, type, selectedItem}) => {
      switch (type) {
        case useCombobox.stateChangeTypes.InputChange:
          setInputValue(inputValue);
          setAliasSearch(inputValue);
          break;
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputBlur:
          if (selectedItem) {
            setLedger(ledger.addAlias(selectedIdentityId, selectedItem));
            setInputValue("");
            selectItem(null);
          }
          break;
        default:
          break;
      }
    },
  });
  return (
    <div>
      <label>
        <h2>Aliases:</h2>
      </label>
      <div>
        {selectedIdentity.aliases.map((alias, index) => (
          <span key={`selected-item-${index}`}>
            <Markdown
              renderers={{paragraph: "span"}}
              source={alias.description}
            />
            <br />
          </span>
        ))}
        <div style={comboboxStyles} {...getComboboxProps()}>
          <input {...getInputProps()} />
          <button {...getToggleButtonProps()} aria-label={"toggle menu"}>
            &#8595;
          </button>
        </div>
      </div>
      <ul {...getMenuProps()} style={menuMultipleStyles}>
        {isOpen &&
          inputItems.map((alias, index) => (
            <li
              style={
                highlightedIndex === index ? {backgroundColor: "#bde4ff"} : {}
              }
              key={`${alias.address}${index}`}
              {...getItemProps({alias, index})}
            >
              <Markdown
                renderers={{link: "span", paragraph: "span"}}
                source={alias.description}
              />
            </li>
          ))}
      </ul>
    </div>
  );
}

const comboboxStyles = {display: "inline-block", marginLeft: "5px"};

const menuMultipleStyles = {
  maxHeight: "180px",
  overflowY: "auto",
  width: "135px",
  margin: 0,
  borderTop: 0,
  background: "white",
  position: "absolute",
  zIndex: 1000,
  listStyle: "none",
  padding: 0,
};
import React, { Component, Fragment } from 'react'
import cssModules from 'react-css-modules'
import { connect } from 'redaction'
import actions from 'redux/actions'
import constants from 'helpers/constants'

import Row from './Row/Row'
import Table from 'components/tables/Table/Table'
import Title from 'components/PageHeadline/Title/Title'
import tableStyles from 'components/tables/Table/Table.scss'
import MyOrders from './MyOrders/MyOrders'
import { Button } from 'components/controls'

import PAIR_TYPES from 'helpers/constants/PAIR_TYPES'
import Pair, { parseTicker } from './Pair'

import styles from './Orders.scss'


const filterMyOrders = (orders, peer) => orders
  .filter(order => order.owner.peer === peer)

const filterOrders = (orders, filterTicker) => orders
  .filter(order => Pair.check(order, filterTicker))
  .sort((a, b) => Pair.compareOrders(b, a))

@connect(({
  core: { orders, filter },
  ipfs: { isOnline, peer },
  currencies: { items: currencies },
}) => ({
  orders: filterOrders(orders, filter),
  myOrders: filterMyOrders(orders, peer),
  isOnline,
  currencies,
}))
@cssModules(styles)
export default class Orders extends Component {

  state = {
    buyOrders: [],
    sellOrders: [],
  }

  static getDerivedStateFromProps({ orders, sellCurrency, buyCurrency }) {
    if (!Array.isArray(orders)) { return }

    const sellOrders = orders
      .filter(order => Pair.fromOrder(order).isAsk())

    const buyOrders = orders
      .filter(order => Pair.fromOrder(order).isBid())

    console.log('orders', orders.map(Pair.fromOrder))
    console.log(buyOrders, sellOrders)

    return {
      buyOrders,
      sellOrders,
    }
  }

  createOffer = () => {
    actions.modals.open(constants.modals.Offer, {
      buyCurrency: this.props.buyCurrency,
      sellCurrency: this.props.sellCurrency,
    })
    actions.analytics.dataEvent('orderbook-click-createoffer-button')
  }

  removeOrder = (orderId) => {
    actions.core.removeOrder(orderId)
    actions.core.updateCore()
  }

  acceptRequest = (orderId, peer) => {
    actions.core.acceptRequest(orderId, peer)
    actions.core.updateCore()
  }

  declineRequest = (orderId, peer) => {
    actions.core.declineRequest(orderId, peer)
    actions.core.updateCore()
  }

  render() {
    const { sellOrders, buyOrders } = this.state
    const { sellCurrency, buyCurrency } = this.props
    const titles = [ 'OWNER', 'EXCHANGE', 'AMOUNT', 'PRICE', 'TOTAL', 'START EXCHANGE' ]
    const { isOnline, myOrders, orderId } = this.props

    return (
      <Fragment>
        <Title>{buyCurrency} &#8594; {sellCurrency} no limit exchange with 0 fee</Title>
        <MyOrders
          myOrders={myOrders}
          declineRequest={this.declineRequest}
          removeOrder={this.removeOrder}
          acceptRequest={this.acceptRequest}
        />
        <Button gray styleName="button" onClick={this.createOffer}>Create offer</Button>
        {
          sellOrders.length > 0 && (
            <Fragment>
              <h3>ASK</h3>
              <Table
                id="table_exchange"
                classTitle={tableStyles.exchange}
                titles={titles}
                rows={sellOrders}
                rowRender={(row, index) => (
                  <Row
                    key={index}
                    orderId={orderId}
                    row={row}
                  />
                )}
                isLoading={!isOnline}
              />
            </Fragment>
          )
        }
        {
          buyOrders.length > 0 && (
            <Fragment>
              <h3>BID</h3>
              <Table
                id="table_exchange"
                classTitle={tableStyles.exchange}
                titles={titles}
                rows={buyOrders}
                rowRender={(row, index) => (
                  <Row
                    key={index}
                    orderId={orderId}
                    row={row}
                  />
                )}
                isLoading={!isOnline}
              />
            </Fragment>
          )
        }
      </Fragment>
    )
  }
}

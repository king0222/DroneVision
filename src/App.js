import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import reducer from './store/reducer';
import { BrowserRouter } from 'react-router-dom';
import Routes from './Routes';
import Footer from './components/Footer';

const store = createStore(reducer);

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <Routes />
        </BrowserRouter>
      </Provider>
    );
  }
}

export default App;

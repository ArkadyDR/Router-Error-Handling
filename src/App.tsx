import React, { Component, ErrorInfo, useState } from 'react';
import './App.css';
import 'semantic-ui-css/semantic.min.css';
import { BrowserRouter, Route, Link, Switch, RouteComponentProps } from 'react-router-dom';
import { Grid, Menu, Segment, Button } from 'semantic-ui-react';

class App extends Component {
  render() {
    return (
      <ErrorBoundary fallback={DefaultFallback}>
        <BrowserRouter>
          <Route path="/" component={Main} />
        </BrowserRouter>
      </ErrorBoundary>
    );
  }
}

type FallbackComponent = React.FunctionComponent<{ error: Error }>;
const DefaultFallback: FallbackComponent = ({ error }) => <p>Oops! This is the default fallback. {error.message}</p>;
const CustomFallback1: FallbackComponent = ({ error }) => <p>This is the custom fallback 1. {error.message}</p>;
const CustomFallback2: FallbackComponent = ({ error }) => <p>This is the custom fallback 2. {error.message}</p>;
const FallbackContext = React.createContext<{ fallback: FallbackComponent }>({ fallback: DefaultFallback });

const Main: React.FunctionComponent<RouteComponentProps> = ({ match }) => 
  <Grid rows={1} columns={2}>
    <Grid.Column width="2">
      <Menu vertical>
        <Menu.Item><Link to="/alpha">Alpha</Link></Menu.Item>
        <Menu.Item><Link to="/bravo">Bravo</Link></Menu.Item>
        <Menu.Item><Link to="/charlie">Charlie</Link></Menu.Item>
        <Crasher name='Nav' />
      </Menu>
    </Grid.Column>
    <Grid.Column width="14">
      <Segment>
        <FallbackContext.Provider value={{ fallback: CustomFallback1 }}>
          <Switch>
            <Route path="/alpha" component={withFallback(Alpha, CustomFallback2)} />
            <Route path="/bravo" render={withFallback(Bravo)} />
          </Switch>
        </FallbackContext.Provider>
        <Switch>
          <Route path="/charlie" render={props => withFallback(() => <Crasher name='Charlie' />)(props)} />
        </Switch>
      </Segment>
    </Grid.Column>
  </Grid>;

const Crasher: React.FunctionComponent<{ name: string }> = ({ name }) => {
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) {
    throw new Error(`${name} crashed!`);
  }

  return <Button onClick={() => { setShouldCrash(true) }}>{ name }</Button>;
}

const Alpha = () => <Crasher name='Alpha' />;
const Bravo = () => <Crasher name='Bravo' />;

interface EBProps { 
  fallback: React.ComponentType<{ error: Error }>
}

interface EBState {
  error ?: Error
}

class ErrorBoundary<P extends EBProps> extends React.Component<P, EBState> {
  state: EBState = {};

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.log(error);
  }

  render() {
    if (this.state.error) {
      return React.createElement(this.props.fallback, { error: this.state.error });
    }

    return this.props.children;
  }
}

class RoutedErrorBoundary extends ErrorBoundary<RouteComponentProps & EBProps> {
  componentDidUpdate(prevProps: RouteComponentProps & EBProps) {
    // clear the error if we routed away, we may be able to render successfully on return
    if (prevProps.location !== this.props.location) {
      this.setState({ error: undefined });
    }
  }
}

function withFallback(component: React.ComponentType, fallback?: FallbackComponent) {
  return (props: RouteComponentProps) => (
    <FallbackContext.Consumer>
      { value => 
        <RoutedErrorBoundary fallback={fallback ? fallback : value.fallback} {...props}>
          {React.createElement(component)}
        </RoutedErrorBoundary>
      }
    </FallbackContext.Consumer>
  );
}

export default App;

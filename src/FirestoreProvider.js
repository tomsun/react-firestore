import { Component } from 'react';
import PropTypes from 'prop-types';
import FirestoreCache from './FirestoreCache';

export default class FirestoreProvider extends Component {
  static propTypes = {
    firebase: PropTypes.object.isRequired,
    children: PropTypes.node.isRequired,
    useTimestampsInSnapshots: PropTypes.bool,
  };

  static defaultProps = {};

  static childContextTypes = {
    firestoreDatabase: PropTypes.object.isRequired,
    firestoreCache: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    const { firebase, useTimestampsInSnapshots } = props;
    const firestore = firebase.firestore();
    if (typeof useTimestampsInSnapshots !== 'undefined') {
      const settings = { timestampsInSnapshots: useTimestampsInSnapshots };
      firestore.settings(settings);
    }

    this.state = {
      firestoreDatabase: firestore,
      firestoreCache: new FirestoreCache(),
    };
  }

  getChildContext() {
    const { firestoreDatabase, firestoreCache } = this.state;

    return { firestoreDatabase, firestoreCache };
  }

  render() {
    return this.props.children;
  }
}

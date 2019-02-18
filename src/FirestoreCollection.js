import { Component } from 'react';
import PropTypes from 'prop-types';
import deepEqual from './utils/deepEqual';

class FirestoreCollection extends Component {
  static propTypes = {
    path: PropTypes.string.isRequired,
    sort: PropTypes.string,
    startAt: PropTypes.PropTypes.any,
    startAfter: PropTypes.PropTypes.any,
    endBefore: PropTypes.PropTypes.any,
    endAt: PropTypes.PropTypes.any,
    limit: PropTypes.number,
    filter: PropTypes.oneOfType([
      PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.number,
          PropTypes.object,
        ]),
      ),
      PropTypes.arrayOf(PropTypes.array),
    ]),
    children: PropTypes.func,
    render: PropTypes.func,
  };

  static contextTypes = {
    firestoreDatabase: PropTypes.object.isRequired,
    firestoreCache: PropTypes.object.isRequired,
  };

  state = {
    isLoading: true,
    data: [],
    error: null,
    snapshot: null,
  };

  componentDidMount() {
    this.setupFirestoreListener(this.props);
  }

  componentWillUnmount() {
    this.handleUnsubscribe();
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.path !== this.props.path ||
      nextProps.sort !== this.props.sort ||
      nextProps.startAt !== this.props.startAt ||
      nextProps.startAfter !== this.props.startAfter ||
      nextProps.endBefore !== this.props.endBefore ||
      nextProps.endAt !== this.props.endAt ||
      nextProps.limit !== this.props.limit ||
      !deepEqual(nextProps.filter, this.props.filter)
    ) {
      this.handleUnsubscribe();

      this.setState({ isLoading: true }, () =>
        this.setupFirestoreListener(this.props),
      );
    }
  }

  handleUnsubscribe() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  setupFirestoreListener = props => {
    const { firestoreDatabase } = this.context;
    const { path, ...queryProps } = props;
    const collectionRef = firestoreDatabase.collection(path);
    const query = this.buildQuery(collectionRef, queryProps);

    this.unsubscribe = query.onSnapshot(
      this.handleOnSnapshotSuccess,
      this.handleOnSnapshotError,
    );
  };

  handleOnSnapshotSuccess = snapshot => {
    if (snapshot) {
      this.setState({
        isLoading: false,
        data: snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })),
        error: null,
        snapshot,
      });
    }
  };

  handleOnSnapshotError = error => {
    this.setState({
      isLoading: false,
      data: [],
      error,
      snapshot: null,
    });
  };

  buildQuery = (collectionRef, queryProps) => {
    const { sort, startAt, startAfter, endBefore, endAt, limit, filter } = queryProps;
    let query = collectionRef;

    if (sort) {
      sort.split(',').forEach(sortItem => {
        const [field, order] = sortItem.split(':');

        query = query.orderBy(field, order);
      });
    }

    if (startAt) {
      query = query.startAt(startAt);
    }

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    if (endBefore) {
      query = query.endBefore(endBefore);
    }

    if (endAt) {
      query = query.endAt(endAt);
    }

    if (limit) {
      query = query.limit(limit);
    }

    if (filter) {
      //if filter is array of array, build the compound query
      if (Array.isArray(filter[0])) {
        filter.forEach(clause => {
          query = query.where(...clause);
        });
      } else {
        //build the simple query
        query = query.where(...filter);
      }
    }

    return query;
  };

  render() {
    const { children, render } = this.props;

    if (render) return render(this.state);

    if (typeof children === 'function') return children(this.state);

    return null;
  }
}

export default FirestoreCollection;

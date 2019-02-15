/**
 * External dependencies
 */
import { isUndefined, pickBy, split } from 'lodash';

/**
 * WordPress dependencies
 */
const apiFetch = wp.apiFetch;
const { withSelect } = wp.data;
const { Component, Fragment } = wp.element;
const { addQueryArgs } = wp.url;

/**
 * Internal dependencies
 */
import SpeakersBlockControls from './block-controls';
import SpeakersInspectorControls from './inspector-controls';
import SpeakersToolbar from './toolbar';
import './edit.scss';

const MAX_POSTS = 100;

const ALL_POSTS_QUERY = {
	orderby  : 'title',
	order    : 'asc',
	per_page : MAX_POSTS,
	_embed   : true,
};

const ALL_TERMS_QUERY = {
	orderby  : 'name',
	order    : 'asc',
	per_page : MAX_POSTS,
};

class SpeakersEdit extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			allSpeakerPosts : null,
			allSpeakerTerms : null,
		};
	}

	componentWillMount() {
		this.isStillMounted = true;

		const allSpeakerPosts = apiFetch( {
			path: addQueryArgs( `/wp/v2/speakers`, ALL_POSTS_QUERY ),
		} );
		const allSpeakerTerms = apiFetch( {
			path: addQueryArgs( `/wp/v2/speaker_group`, ALL_TERMS_QUERY ),
		} );

		if ( this.isStillMounted ) {
			this.setState( {
				allSpeakerPosts : allSpeakerPosts, // Promise
				allSpeakerTerms : allSpeakerTerms, // Promise
			} );
		}
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	render() {
		const { mode } = this.props.attributes;

		return (
			<Fragment>
				<SpeakersBlockControls { ...this.props } { ...this.state } />
				{ mode &&
					<Fragment>
						<SpeakersInspectorControls { ...this.props } />
						<SpeakersToolbar { ...this.props } />
					</Fragment>
				}
			</Fragment>
		);
	}
}

const speakersSelect = ( select, props ) => {
	const { mode, post_ids, term_ids, sort } = props.attributes;
	const { getEntityRecords } = select( 'core' );
	const [ orderby, order ] = split( sort, '_', 2 );

	const args = {
		orderby  : orderby,
		order    : order,
		per_page : MAX_POSTS, // -1 is not allowed for per_page.
		_embed   : true,
		context  : 'view',
	};

	if ( 'specific_posts' === mode && Array.isArray( post_ids ) ) {
		args.include = post_ids;
	}

	if ( 'specific_terms' === mode && Array.isArray( term_ids ) ) {
		args.speaker_group = term_ids;
	}

	const speakersQuery = pickBy( args, ( value ) => ! isUndefined( value ) );

	return {
		speakerPosts : getEntityRecords( 'postType', 'wcb_speaker', speakersQuery ),
		tracks       : getEntityRecords( 'taxonomy', 'wcb_track', { per_page: MAX_POSTS } ),
	};
};

export const edit = withSelect( speakersSelect )( SpeakersEdit );
import FavouriteActivity from "./FavouriteActivity";

export default function GeneralStats({ membershipType, userId }) {

    return(
        <div>
            <h1>General Stats</h1>
            <FavouriteActivity membershipType={membershipType} userId={userId} />
        </div>
    )
}
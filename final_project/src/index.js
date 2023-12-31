import React from "react";
import ReactDOM from "react-dom";
import { csv, json } from "d3";
import { groupByAirline, groupByAirport } from "./utils";
import "./styles.css";
import { ClubMap } from "./uefaClubMap";
import { BarChart } from "./barChart";
import { AirportBubble} from "./airportBubble";


// The csv file with the club rankings in the competition (uses fifa country codes)
const csvUrl = 'https://gist.githubusercontent.com/danysigha/f3e5054ce147833a899178553eb2d883/raw/f27858668ec440a9e85745a6b827b3ebd8fd6185/alltimerankingbyclub.csv';

// The geojson of the map of Europe
const mapUrl = 'https://raw.githubusercontent.com/leakyMirror/map-of-europe/master/GeoJSON/europe.geojson';

// The mapping between fifa country codes and the country names
const codesUrl = 'https://gist.githubusercontent.com/danysigha/774a124bc279c56ed4323802dafd6445/raw/200692a0c0941e3c8086fb94e9a3436f131cd337/fifa_codes.csv'; 

// logos of european clubs - csv of file name (club name) --> logo path mappings  
const logosUrl = "https://gist.githubusercontent.com/danysigha/94022b90211d99126d5b3cf3eabe3278/raw/c09de7f7db821aef4bc73fdec584be150c03c7c3/clublogos.csv";


// table with the clubs and their ranking in Champions League
function useRankingsData(csvPath){
    const [dataAll, setData] = React.useState(null);
    React.useEffect(() => {
        csv(csvPath).then(data => {
            data.forEach(d => {
                d.Titles = +d.Titles
                d.Pts = +d.Pts
                d.Position = +d.Position
                d.Win = +d.Win
                d.Draw = +d.Draw
                d.Loss = +d.Loss
                d.Played = +d.Played
                d.Participated = +d.Participated
            });
            setData(data);
        });
    }, []);
    return dataAll;
}

// the table with Fifa code to country name mappings
function useFifaData(csvPath){
    const [dataAll, setData] = React.useState(null);
    React.useEffect(() => {
        csv(csvPath).then(data => {
            setData(data);
        });
    }, []);
    return dataAll;
}

// the funciton to display the map of Europe
function useMap(jsonPath) {
    const [data, setData] = React.useState(null);
    React.useEffect(() => {
        json(jsonPath).then(geoJsonData => {
            setData(geoJsonData);
        })
    }, []);
    return data;
}

// function to read the club name --> logo path mappings
function useClubLogos(csvPath){
    const [dataAll, setData] = React.useState(null);
    React.useEffect(() => {
        csv(csvPath).then(data => {
            setData(data);
        });
    }, []);
    return dataAll;
}

// the function to display the points on the map
function UefaClubs(){
    const map_height = 700;
    const rankings = useRankingsData(csvUrl);
    const fifa_codes = useFifaData(codesUrl);
    const clubLogos = useClubLogos(logosUrl);

    const map = useMap(mapUrl);
    

    if (!map || !rankings) {
        return <pre>Loading...</pre>;
    };

    // Group clubs by the "Country" attribute
    const groupedArray = rankings.reduce((acc, member) => {
        const { Country, ...rest } = member;

        // IMPORTANT – the number of clubs to display on map (should make a slider for this)
        // tooltip feature is still missing
        if (member.Position <= 100){ 
            // Check if the country key already exists in the accumulator
            if (!acc[Country]) {
                // If not, create a new key with an array containing the current member
                acc[Country] = [rest];
            } else {
                // If yes, push the current member to the existing array
                acc[Country].push(rest);
            }
        }
        return acc;
    }, {});


    // Convert the grouped data into an array of key-value pairs
    // the keys are Fifa country codes
    const groupedClubs = Object.entries(groupedArray);
    // console.log(groupedClubs);


    // map fifa codes to country names
    const code_country_map = fifa_codes.reduce((acc, member) => {
        const { FIFA, CLDR_display_name } = member;
        
        // Check if the country key already exists in the accumulator
        if (!acc[FIFA]) {
            if (FIFA == "ENG,NIR,SCO,WAL"){
                acc["ENG"] = "United Kingdom";
                acc["SCO"] = "United Kingdom";
                acc["NIR"] = "Ireland";
                acc["WAL"] = "Wales";
                acc["CZE"] = "Czech Republic";
            }else{
                acc[FIFA] = CLDR_display_name;
            }
            // If not, create a new key with an array containing the current member
        }
        return acc;
    }, {});


    
    // new object with country names as keys and array of club names as values
    const newGroupedClubs = {};

    for (const [index, [clubFifaCode, clubs]] of Object.entries(groupedClubs)) {
        if (code_country_map[clubFifaCode]) {
            const countryKey = code_country_map[clubFifaCode];
    
            if (newGroupedClubs[countryKey]) {
                // Country key already exists, push clubs
                clubs.forEach(e => {
                    newGroupedClubs[countryKey].push(e["Club"]);
                });
            } else {
                // Create a new array for the country key
                newGroupedClubs[countryKey] = clubs.map(e => e["Club"]);
            }
        }
    }
    // console.log(newGroupedClubs);
    

    // need to add a header indicating that the map is Europe
    return <div>
        <h1>UEFA CHAMPIONS LEAGUE – a visual narrative</h1>   
        
        <div className={"mainView"}>
            
            <div className="full-width-container">
                
                <svg id={"map"} height={map_height} width={window.innerWidth/2}>
                    <ClubMap width={window.innerWidth/2} height={map_height} map={map} 
                    clubs={newGroupedClubs} logos={clubLogos} />
                </svg>

            </div>
            

            <div>
                <svg id={"view1"} height={map_height/2} width={window.innerWidth/2} style={{ position: 'absolute', left: (window.innerWidth / 2)+10, top:(map_height/2)+90 }}>
                </svg>
            </div>

            <div>
                <svg id={"view2"} height={map_height/2} width={window.innerWidth/2}>
                </svg>
            </div>
            
        </div>

    </div>
}

ReactDOM.render(<UefaClubs/ >, document.getElementById("root"));
import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { CreateRoom } from "./routes/CreateRoom";
import { Room } from "./routes/Room";
import { useEffect } from "react";

const Child = ({a}) => { console.log("child renders") ; return (
  <div>Child Component {a}</div>
)}

function App() {
  let a = 123
  useEffect(()=>{
    a = 233
  }, [])
  return (
    <div className="App" style={{display: 'grid', placeItems: 'center', height: '100vh'}}>
      <BrowserRouter>
        <Switch>
          <Route path={"/"} exact ><CreateRoom /></Route>
          <Route path={"/room/:roomId"} ><Room /></Route>
        </Switch>
      </BrowserRouter>
      <Child a={a}/>
    </div>
  );
}

export default App;

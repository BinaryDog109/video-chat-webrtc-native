import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { CreateRoom } from "./routes/CreateRoom";
import { Room } from "./routes/Room";
import { useEffect } from "react";



function App() {

  return (
    <div className="App" style={{display: 'grid', placeItems: 'center', height: '100vh'}}>
      <BrowserRouter>
        <Switch>
          <Route path={"/"} exact ><CreateRoom /></Route>
          <Route path={"/room/:roomId"} ><Room /></Route>
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;

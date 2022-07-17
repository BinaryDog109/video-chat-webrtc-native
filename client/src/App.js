import "./App.css";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import { CreateRoom } from "./routes/CreateRoom";
import { Room } from "./routes/Room";

function App() {
  return (
    <div className="App">
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

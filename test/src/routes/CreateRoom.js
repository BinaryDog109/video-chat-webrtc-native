import {useHistory} from "react-router-dom"
import { v4 as uuid } from 'uuid';

export const CreateRoom = () => {
    const history = useHistory()
    const onHandleCreateRoom = e => {
        history.push(`/room/${uuid()}`)
    }
  return (
    
      <button style={{
      padding: '1em',
      fontSize: '1.5em',
      backgroundColor: 'lightgreen'
    }} onClick={onHandleCreateRoom}>Create a room</button>
    
    
  )
}